/**
 * Arbitrum Open House — judge-friendly agent demo bundle.
 *
 * GET /api/v1/aave-risk/arbitrum/agent-pack/:address
 *
 * Returns deterministic user risk + CRE orchestration output for Arbitrum One,
 * plus optional on-chain policy guard address from env.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { createMarketDataProvider } from "../../../adapters/providerFactory.js";
import { getCreOrchestrationAdapter } from "../../../infrastructure/orchestration/index.js";
import { UserRiskProjectionService } from "../../../services/health-engine/user-risk-projection.js";
import { assertAaveValidationMode } from "./validation-guard.js";
import { normalizeEthereumAddress } from "./address-normalizer.js";

const ARBITRUM_CHAIN = "arbitrum" as const;
const projection = new UserRiskProjectionService();
const creOrchestration = getCreOrchestrationAdapter();

export function createArbitrumAgentPackRoute() {
  return async function arbitrumAgentPackPlugin(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    app.get<{ Params: { address: string } }>(
      "/:address",
      async (request, reply) => {
        if (!assertAaveValidationMode(reply)) return;

        const normalizedAddress = normalizeEthereumAddress(request.params.address);
        if (!normalizedAddress) {
          return reply.status(400).send({
            error: "Invalid Ethereum address",
            message: "Address must be a valid 0x-prefixed 40-character hex string.",
          });
        }

        try {
          const provider = createMarketDataProvider();

          const [userRisk, creSubmitted] = await Promise.all([
            projection.getUserRisk(normalizedAddress, "aave", ARBITRUM_CHAIN),
            creOrchestration.submitIntent({
              type: "cre.workflow",
              options: {
                provider,
                chainId: ARBITRUM_CHAIN,
                positionLimit: 50,
                enableLLM: !!process.env.GROQ_API_KEY,
                groqApiKey: process.env.GROQ_API_KEY,
              },
            }),
          ]);

          const creWorkflow =
            creSubmitted.status === "completed" && creSubmitted.result
              ? creSubmitted.result
              : null;

          return reply.send({
            chain: ARBITRUM_CHAIN,
            evmChainId: 42161,
            user: normalizedAddress,
            userRisk,
            creWorkflow,
            creStatus: creSubmitted.status,
            creError: creSubmitted.error ?? null,
            onChain: {
              policyGuardAddress:
                process.env.ARBITRUM_POLICY_GUARD_ADDRESS?.trim() ?? null,
              network: process.env.ARBITRUM_NETWORK?.trim() ?? "one",
            },
            disclosureKind: "advisory",
            generatedAt: new Date().toISOString(),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("No active Aave position found")) {
            return reply.status(404).send({
              error: "User position not found",
              message,
              hint: "Use an Arbitrum wallet with an active Aave v3 position, or DATA_PROVIDER_MODE=mock for synthetic demo data.",
            });
          }
          return reply.status(500).send({
            error: "Unable to build Arbitrum agent pack",
            message,
          });
        }
      }
    );
  };
}
