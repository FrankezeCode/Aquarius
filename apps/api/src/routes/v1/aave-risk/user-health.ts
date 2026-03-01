/**
 * API Route — User Health Score
 *
 * GET /v1/aave-risk/user-health/:address
 *
 * Returns a deterministic, penalty-adjusted health score for a specific wallet.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { HealthEngine } from "../../../services/health-engine/index.js";
import { assertAaveValidationMode } from "./validation-guard.js";
import { normalizeEthereumAddress } from "./address-normalizer.js";
import { isAaveActiveChain, resolveAaveActiveChain } from "./chain.js";

const engine = new HealthEngine();

export function createUserHealthRoute() {
  return async function userHealthPlugin(
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
            message: `Unsupported chain "${request.query.chain}". Supported chains: ethereum, polygon.`,
          });
        }
        const chain = resolveAaveActiveChain(requestedChain);
        const { address } = request.params;
        const normalizedAddress = normalizeEthereumAddress(address);

        if (!normalizedAddress) {
          return reply.status(400).send({
            error: "Invalid Ethereum address",
            message: "Address must be a valid 0x-prefixed 40-character hex string.",
          });
        }

        try {
          const result = await engine.getUserHealth(normalizedAddress, "aave", chain);
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
            error: "Unable to compute user health",
            message,
          });
        }
      }
    );
  };
}
