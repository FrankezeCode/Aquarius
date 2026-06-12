/**
 * API Route — Unified User Risk (versioned contract)
 *
 * GET /v1/aave-risk/user-risk/:address
 *
 * Returns one coherent user-risk projection intended for direct
 * frontend card rendering and SDK consumption.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { UserRiskProjectionService } from "../../../services/health-engine/user-risk-projection.js";
import { assertAaveValidationMode } from "./validation-guard.js";
import { normalizeEthereumAddress } from "./address-normalizer.js";
import {
  formatAaveActiveChains,
  isAaveActiveChain,
  resolveAaveActiveChain,
} from "./chain.js";

const projection = new UserRiskProjectionService();

export function createUserRiskRoute() {
  return async function userRiskPlugin(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    app.get<{ Params: { address: string }; Querystring: { chain?: string } }>(
      "/:address",
      async (request, reply) => {
        if (!assertAaveValidationMode(reply)) return;

        const requestedChain = request.query.chain?.toLowerCase();
        if (requestedChain && !isAaveActiveChain(requestedChain)) {
          return reply.status(400).send({
            error: "Unsupported chain",
            message: `Unsupported chain "${request.query.chain}". Supported chains: ${formatAaveActiveChains()}.`,
          });
        }
        const chain = resolveAaveActiveChain(requestedChain);

        const normalizedAddress = normalizeEthereumAddress(request.params.address);
        if (!normalizedAddress) {
          return reply.status(400).send({
            error: "Invalid Ethereum address",
            message: "Address must be a valid 0x-prefixed 40-character hex string.",
          });
        }

        try {
          const result = await projection.getUserRisk(normalizedAddress, "aave", chain);
          return reply.send(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("No active Aave position found")) {
            return reply.status(404).send({
              error: "User position not found",
              message,
            });
          }
          return reply.status(500).send({
            error: "Unable to compute unified user risk",
            message,
          });
        }
      }
    );
  };
}
