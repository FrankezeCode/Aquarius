/**
 * API Route — User Health Score
 *
 * GET /v1/aave-risk/user-health/:address
 *
 * Returns a deterministic, penalty-adjusted health score for a specific wallet.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { HealthEngine } from "../../../services/health-engine/index.js";

const engine = new HealthEngine();

export function createUserHealthRoute() {
  return async function userHealthPlugin(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    app.get<{ Params: { address: string } }>(
      "/:address",
      async (request, reply) => {
        const { address } = request.params;

        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
          return reply.status(400).send({
            error: "Invalid Ethereum address",
            message: "Address must be a valid 0x-prefixed 40-character hex string.",
          });
        }

        const result = await engine.getUserHealth(address, "aave");
        return reply.send(result);
      }
    );
  };
}
