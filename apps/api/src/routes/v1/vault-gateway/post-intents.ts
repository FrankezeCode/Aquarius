import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { ZodError } from "zod";
import type {
  OrchestrationPort,
  VaultIntentEnvelope,
} from "../../../application/ports/orchestration.port.js";
import { loadConfig } from "../../../config/index.js";
import { getCreOrchestrationAdapter } from "../../../infrastructure/orchestration/index.js";
import { getOrchestrationJobStore } from "../../../infrastructure/orchestration/orchestration-job-store.singleton.js";
import {
  evaluatePosDelegationEligibility,
  evaluateVaultExecutionEligibility,
} from "../../../services/vault-gateway/execution-eligibility.js";
import {
  parseVaultIntentBody,
  type VaultIntentBody,
} from "../../../services/vault-gateway/intent.schema.js";
import { matchesVaultIntentBearer } from "./intent-bearer.js";

export interface RegisterVaultGatewayPostIntentsOpts extends FastifyPluginOptions {
  vaultGatewayRateLimitMax?: number;
  /** Default: `getCreOrchestrationAdapter()`. Inject a mock for gateway-only tests. */
  orchestration?: OrchestrationPort;
}

function formatZodError(e: ZodError): string {
  return e.issues
    .map((i) => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`)
    .join("; ");
}

function bodyToEnvelope(
  body: VaultIntentBody,
  correlationId: string,
  eligibility: {
    creChainId: string;
    normalizedAsset: string;
  }
): VaultIntentEnvelope {
  const base = {
    chain: body.chain,
    asset: body.asset,
    amount: body.amount,
    idempotencyKey: body.idempotencyKey,
    correlationId,
    creChainId: eligibility.creChainId,
    normalizedAsset: eligibility.normalizedAsset,
  };
  if (body.intentType === "aave.vault.protect") {
    return {
      ...base,
      intentType: "aave.vault.protect",
      aqAssetId: body.aqAssetId,
      riskLevel: body.riskLevel,
    };
  }
  if (body.intentType === "pos.delegate") {
    const v = body.validatorAddress.trim();
    return {
      ...base,
      intentType: "pos.delegate",
      validatorAddress: v.toLowerCase() as `0x${string}`,
      partnerId: body.partnerId,
      memo: body.memo,
    };
  }
  if (body.intentType === "aave.buffer.top_up") {
    return { ...base, intentType: "aave.buffer.top_up" };
  }
  return { ...base, intentType: "cre.workflow" };
}

export async function registerVaultGatewayPostIntents(
  app: FastifyInstance,
  opts: RegisterVaultGatewayPostIntentsOpts
) {
  const routeOpts =
    opts.vaultGatewayRateLimitMax != null && opts.vaultGatewayRateLimitMax > 0
      ? {
          config: {
            rateLimit: {
              max: opts.vaultGatewayRateLimitMax,
              timeWindow: "1 minute" as const,
            },
          },
        }
      : {};

  app.post("/intents", routeOpts, async (request, reply) => {
    const config = loadConfig();
    const jobStore = getOrchestrationJobStore();
    const orchestration = opts.orchestration ?? getCreOrchestrationAdapter();

    if (!config.vaultGatewayExecutionEnabled) {
      return reply.status(403).send({
        kind: "rejected",
        reasonCode: "EXECUTION_DISABLED",
        message: "Vault gateway execution is not enabled for this deployment.",
      });
    }

    if (
      !matchesVaultIntentBearer(
        request.headers.authorization,
        config.vaultGatewayIntentTokens
      )
    ) {
      return reply.status(401).send({
        kind: "rejected",
        reasonCode: "UNAUTHORIZED",
        message: "Missing or invalid credentials.",
      });
    }

    let body: VaultIntentBody;
    try {
      body = parseVaultIntentBody(request.body);
    } catch (e) {
      if (e instanceof ZodError) {
        return reply.status(400).send({
          kind: "rejected",
          reasonCode: "VALIDATION_ERROR",
          message: formatZodError(e),
        });
      }
      throw e;
    }

    const correlationId = body.correlationId ?? randomUUID();

    const cached = await jobStore.getVaultIdempotency(body.idempotencyKey);
    if (cached) {
      return reply.status(200).send(cached);
    }

    const eligibility =
      body.intentType === "pos.delegate"
        ? evaluatePosDelegationEligibility(body.chain, body.asset)
        : evaluateVaultExecutionEligibility(body.chain, body.asset);
    if (!eligibility.ok) {
      return reply.status(422).send({
        kind: "rejected",
        correlationId,
        reasonCode: eligibility.reasonCode,
        message: eligibility.message,
      });
    }

    const envelope = bodyToEnvelope(body, correlationId, {
      creChainId: eligibility.creChainId,
      normalizedAsset: eligibility.normalizedAsset,
    });

    const result = await orchestration.submitIntent({
      type: "vault.intent",
      envelope,
    });

    if (result.status === "failed") {
      return reply.status(503).send({
        kind: "rejected",
        correlationId,
        reasonCode: "ORCHESTRATION_FAILED",
        message: result.error ?? "Orchestration failed",
      });
    }

    const successBody = {
      kind: "submitted" as const,
      correlationId,
      jobId: result.jobId,
      workflowId: result.jobId,
      status: "accepted" as const,
      orchestrationStatus: result.status,
      workflowDefinitionId: result.workflowDefinitionId,
      externalWorkflowId: result.externalWorkflowId,
      intentType: body.intentType,
    };

    await jobStore.setVaultIdempotency(
      body.idempotencyKey,
      successBody as Record<string, unknown>,
      config.vaultGatewayIdempotencyTtlMs
    );

    return reply.status(202).send(successBody);
  });
}
