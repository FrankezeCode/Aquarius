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

const engine = new HealthEngine();

export function createProtocolHealthRoute() {
  return async function protocolHealthPlugin(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    app.get<{ Params: { chain?: string } }>(
      "/:chain",
      async (request, reply) => {
        const chain = request.params.chain ?? "ethereum";
        const result = await engine.getProtocolHealth("aave", chain);
        return reply.send(result);
      }
    );

    app.get("/", async (_request, reply) => {
      const result = await engine.getProtocolHealth("aave", "ethereum");
      return reply.send(result);
    });
  };
}
