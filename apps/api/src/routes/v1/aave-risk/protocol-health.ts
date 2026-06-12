/**
 * API Route — Protocol Health Score
 *
 * GET /v1/aave-risk/protocol-health
 * GET /v1/aave-risk/protocol-health/:chain
 *
 * Returns a deterministic, AI-augmented health score for the Aave protocol.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { HealthEngine } from "../../../services/health-engine/index.js";
import { assertAaveValidationMode } from "./validation-guard.js";
import {
  formatAaveActiveChains,
  isAaveActiveChain,
  resolveAaveActiveChain,
} from "./chain.js";

const engine = new HealthEngine();

export function createProtocolHealthRoute() {
  return async function protocolHealthPlugin(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    app.get<{ Params: { chain?: string } }>(
      "/:chain",
      async (request, reply) => {
        if (!assertAaveValidationMode(reply)) return;
        const requestedChain = request.params.chain?.toLowerCase();
        if (requestedChain && !isAaveActiveChain(requestedChain)) {
          return reply.status(400).send({
            error: "Unsupported chain",
            message: `Unsupported chain "${request.params.chain}". Supported chains: ${formatAaveActiveChains()}.`,
          });
        }
        const chain = resolveAaveActiveChain(requestedChain);
        try {
          const result = await engine.getProtocolHealth("aave", chain);
          return reply.send(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return reply.status(500).send({
            error: "Unable to compute protocol health",
            message,
          });
        }
      }
    );

    app.get("/", async (_request, reply) => {
      if (!assertAaveValidationMode(reply)) return;
      try {
        const result = await engine.getProtocolHealth("aave", "ethereum");
        return reply.send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({
          error: "Unable to compute protocol health",
          message,
        });
      }
    });
  };
}
