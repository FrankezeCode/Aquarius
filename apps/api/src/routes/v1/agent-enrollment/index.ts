import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AgentEnrollmentService } from "../../../services/agent-enrollment/service.js";
import {
  parseBufferVaultDepositDemoBody,
  parseBindIntentBody,
  parseChain,
  parseConfirmBindBody,
  parseConfirmDeactivateBody,
  parseDeactivateIntentBody,
  parseEnrollmentCreateBody,
  parseValidateChannelsInput,
} from "../../../services/agent-enrollment/schema.js";
import { normalizeEthereumAddress } from "../aave-risk/address-normalizer.js";
import {
  assertAaveValidationMode,
  assertTenderlyBindingMode,
} from "../aave-risk/validation-guard.js";

const service = new AgentEnrollmentService();
type BufferVaultDemoPosition = {
  walletAddress: string;
  chain: "ethereum" | "polygon";
  asset: string;
  amount: number;
  estimatedApyPct: number;
  status: "insured_demo";
  receiptId: string;
  depositedAt: number;
  updatedAt: number;
};
const bufferVaultDemoStore = new Map<string, BufferVaultDemoPosition>();

function buildBufferVaultDemoKey(
  walletAddress: string,
  chain: "ethereum" | "polygon"
): string {
  return `${walletAddress.toLowerCase()}:${chain}`;
}

function estimateBufferVaultDemoApy(asset: string): number {
  if (asset === "USDC" || asset === "USDT") return 4.8;
  if (asset === "WETH") return 3.2;
  return 4.0;
}

function isPhaseBPolicyBindingEnabled(): boolean {
  return process.env.PHASE_B_POLICY_BINDING === "1";
}

function resolvePolicyBindingContractAddress(chain: "ethereum" | "polygon"): string | null {
  if (chain === "polygon") {
    return process.env.POLICY_BINDING_CONTRACT_POLYGON ?? null;
  }
  return process.env.POLICY_BINDING_CONTRACT_ETHEREUM ?? null;
}

export async function registerAgentEnrollmentRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.post("/", async (request, reply) => {
    const body = request.body as Record<string, unknown> | null;
    const normalizedAddress = normalizeEthereumAddress(
      typeof body?.walletAddress === "string" ? body.walletAddress : undefined
    );

    if (!normalizedAddress) {
      return reply.status(400).send({
        error: "Invalid wallet address",
        message: "walletAddress must be a valid Ethereum address",
      });
    }

    try {
      const chain = parseChain(body?.chain);
      const payload = parseEnrollmentCreateBody(body);
      const record = await service.createOrUpdateEnrollment({
        walletAddress: normalizedAddress,
        chain,
        mode: payload.mode,
        channels: payload.channels,
        displayName: payload.displayName,
      });
      return reply.send(record);
    } catch (err) {
      return reply.status(400).send({
        error: "Invalid enrollment request",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.get<{ Params: { wallet: string }; Querystring: { chain?: string } }>(
    "/:wallet",
    async (request, reply) => {
      const normalizedAddress = normalizeEthereumAddress(request.params.wallet);
      if (!normalizedAddress) {
        return reply.status(400).send({
          error: "Invalid wallet address",
          message: "wallet path param must be a valid Ethereum address",
        });
      }

      try {
        const chain = parseChain(request.query.chain);
        const record = await service.getEnrollment(normalizedAddress, chain);
        if (!record) {
          return reply.status(404).send({
            error: "Enrollment not found",
            message: `No enrollment found for wallet ${normalizedAddress} on ${chain}.`,
          });
        }
        return reply.send(record);
      } catch (err) {
        return reply.status(400).send({
          error: "Invalid query",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.post("/validate-channels", async (request, reply) => {
    try {
      const payload = parseValidateChannelsInput(request.body);
      return reply.send(service.validateChannels(payload));
    } catch (err) {
      return reply.status(400).send({
        error: "Invalid request",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post("/bind-intent", async (request, reply) => {
    if (!isPhaseBPolicyBindingEnabled()) {
      return reply.status(503).send({
        error: "PHASE_B_DISABLED",
        message:
          "Phase B policy binding is disabled. Set PHASE_B_POLICY_BINDING=1 to enable.",
      });
    }
    if (!assertAaveValidationMode(reply)) return;
    if (!assertTenderlyBindingMode(reply)) return;

    try {
      const payload = parseBindIntentBody(request.body);
      const walletAddress = normalizeEthereumAddress(payload.walletAddress);
      if (!walletAddress) {
        return reply.status(400).send({
          error: "Invalid wallet address",
          message: "walletAddress must be a valid Ethereum address",
        });
      }

      const contractAddress = resolvePolicyBindingContractAddress(payload.chain);
      if (!contractAddress) {
        return reply.status(503).send({
          error: "BINDING_CONTRACT_MISSING",
          message: `Missing policy binding contract address for chain "${payload.chain}".`,
        });
      }

      const record = await service.startBindingIntent({
        walletAddress,
        chain: payload.chain,
        chainId: payload.chainId,
        idempotencyKey: payload.idempotencyKey,
        enrollmentDraft:
          payload.mode && payload.telegram
            ? {
                mode: payload.mode,
                channels: {
                  telegram: payload.telegram,
                  webhook: payload.webhook,
                },
                displayName: payload.displayName,
              }
            : undefined,
      });

      return reply.send({
        walletAddress,
        chain: payload.chain,
        chainId: payload.chainId,
        idempotencyKey: payload.idempotencyKey,
        contractAddress,
        record,
      });
    } catch (err) {
      return reply.status(400).send({
        error: "Invalid bind intent request",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post("/confirm-bind", async (request, reply) => {
    if (!isPhaseBPolicyBindingEnabled()) {
      return reply.status(503).send({
        error: "PHASE_B_DISABLED",
        message:
          "Phase B policy binding is disabled. Set PHASE_B_POLICY_BINDING=1 to enable.",
      });
    }
    if (!assertAaveValidationMode(reply)) return;
    if (!assertTenderlyBindingMode(reply)) return;

    try {
      const payload = parseConfirmBindBody(request.body);
      const walletAddress = normalizeEthereumAddress(payload.walletAddress);
      if (!walletAddress) {
        return reply.status(400).send({
          error: "Invalid wallet address",
          message: "walletAddress must be a valid Ethereum address",
        });
      }

      const record = await service.confirmBinding({
        walletAddress,
        chain: payload.chain,
        chainId: payload.chainId,
        idempotencyKey: payload.idempotencyKey,
        txHash: payload.txHash,
        error: payload.error,
        finalStatus: payload.finalStatus,
      });

      return reply.send(record);
    } catch (err) {
      return reply.status(400).send({
        error: "Invalid confirm bind request",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post("/deactivate-intent", async (request, reply) => {
    if (!isPhaseBPolicyBindingEnabled()) {
      return reply.status(503).send({
        error: "PHASE_B_DISABLED",
        message:
          "Phase B policy binding is disabled. Set PHASE_B_POLICY_BINDING=1 to enable.",
      });
    }
    if (!assertAaveValidationMode(reply)) return;
    if (!assertTenderlyBindingMode(reply)) return;

    try {
      const payload = parseDeactivateIntentBody(request.body);
      const walletAddress = normalizeEthereumAddress(payload.walletAddress);
      if (!walletAddress) {
        return reply.status(400).send({
          error: "Invalid wallet address",
          message: "walletAddress must be a valid Ethereum address",
        });
      }
      const contractAddress = resolvePolicyBindingContractAddress(payload.chain);
      if (!contractAddress) {
        return reply.status(503).send({
          error: "BINDING_CONTRACT_MISSING",
          message: `Missing policy binding contract address for chain "${payload.chain}".`,
        });
      }

      const record = await service.startDeactivationIntent({
        walletAddress,
        chain: payload.chain,
        chainId: payload.chainId,
        idempotencyKey: payload.idempotencyKey,
      });

      return reply.send({
        walletAddress,
        chain: payload.chain,
        chainId: payload.chainId,
        idempotencyKey: payload.idempotencyKey,
        contractAddress,
        record,
      });
    } catch (err) {
      return reply.status(400).send({
        error: "Invalid deactivate intent request",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post("/confirm-deactivate", async (request, reply) => {
    const phaseBEnabled = isPhaseBPolicyBindingEnabled();
    if (phaseBEnabled) {
      if (!assertAaveValidationMode(reply)) return;
      if (!assertTenderlyBindingMode(reply)) return;
    }

    try {
      const payload = parseConfirmDeactivateBody(request.body);
      const walletAddress = normalizeEthereumAddress(payload.walletAddress);
      if (!walletAddress) {
        return reply.status(400).send({
          error: "Invalid wallet address",
          message: "walletAddress must be a valid Ethereum address",
        });
      }

      const record = await service.confirmDeactivation({
        walletAddress,
        chain: payload.chain,
        chainId: payload.chainId,
        idempotencyKey: payload.idempotencyKey,
        txHash: payload.txHash,
        error: payload.error,
      });

      return reply.send(record);
    } catch (err) {
      return reply.status(400).send({
        error: "Invalid confirm deactivate request",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post("/buffer-vault/deposit-demo", async (request, reply) => {
    try {
      const payload = parseBufferVaultDepositDemoBody(request.body);
      const walletAddress = normalizeEthereumAddress(payload.walletAddress);
      if (!walletAddress) {
        return reply.status(400).send({
          error: "Invalid wallet address",
          message: "walletAddress must be a valid Ethereum address",
        });
      }

      const enrollment = await service.getEnrollment(walletAddress, payload.chain);
      if (!enrollment) {
        return reply.status(404).send({
          error: "Enrollment not found",
          message: "Create an agent enrollment first.",
        });
      }
      if (enrollment.status !== "active") {
        return reply.status(409).send({
          error: "Enrollment inactive",
          message: "Enrollment must be active before demo vault onboarding.",
        });
      }
      if (enrollment.mode !== "buffer_vault") {
        return reply.status(409).send({
          error: "Invalid enrollment mode",
          message: "Buffer vault deposit is only available for buffer_vault mode.",
        });
      }

      const now = Date.now();
      const key = buildBufferVaultDemoKey(walletAddress, payload.chain);
      const existing = bufferVaultDemoStore.get(key);
      const record: BufferVaultDemoPosition = {
        walletAddress,
        chain: payload.chain,
        asset: payload.asset,
        amount: payload.amount,
        estimatedApyPct: estimateBufferVaultDemoApy(payload.asset),
        status: "insured_demo",
        receiptId: existing?.receiptId ?? `demo-${crypto.randomUUID()}`,
        depositedAt: existing?.depositedAt ?? now,
        updatedAt: now,
      };
      bufferVaultDemoStore.set(key, record);
      return reply.send(record);
    } catch (err) {
      return reply.status(400).send({
        error: "Invalid buffer vault demo deposit request",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.get<{ Params: { wallet: string }; Querystring: { chain?: string } }>(
    "/buffer-vault/:wallet",
    async (request, reply) => {
      const walletAddress = normalizeEthereumAddress(request.params.wallet);
      if (!walletAddress) {
        return reply.status(400).send({
          error: "Invalid wallet address",
          message: "wallet path param must be a valid Ethereum address",
        });
      }

      try {
        const chain = parseChain(request.query.chain);
        const key = buildBufferVaultDemoKey(walletAddress, chain);
        const record = bufferVaultDemoStore.get(key);
        if (!record) {
          return reply.status(404).send({
            error: "Buffer vault demo position not found",
            message: `No demo buffer vault position found for wallet ${walletAddress} on ${chain}.`,
          });
        }
        return reply.send(record);
      } catch (err) {
        return reply.status(400).send({
          error: "Invalid query",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );
}

