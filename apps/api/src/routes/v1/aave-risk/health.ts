/**
 * API-as-a-Product Layer — GET /health
 *
 * Returns the latest risk health assessment as a normalized DTO.
 * No domain access.  No recomputation.  O(1) read from in-memory cache.
 * Lazy refresh on cold start / TTL expiry (non-blocking).
 *
 * Response shape mirrors MonitorSnapshot:
 *   { protocol, chain, globalRiskIndex, liquidationPressure, timestamp }
 *
 * Hackathon mode: public, no auth.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { RiskQueryService } from "../../../protocols/shared/application/services/risk-query.service.js";
import {
  Protocol,
  VALID_CHAINS,
  DEFAULT_CHAIN,
  type Chain,
} from "../../../protocols/shared/types/risk-api.types.js";

export function createHealthRoute(
  queryService: RiskQueryService,
  protocol: Protocol
) {
  return async function registerHealthRoute(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    // GET /:chain  (e.g. /health/ethereum)
    app.get<{
      Params: { chain?: string };
    }>("/:chain", async (request, reply) => {
      const rawChain = request.params.chain ?? DEFAULT_CHAIN;
      if (!VALID_CHAINS.has(rawChain)) {
        return reply.status(400).send({
          error: `Invalid chain: ${rawChain}`,
          validChains: [...VALID_CHAINS],
        });
      }
      const data = queryService.getHealth(protocol, rawChain as Chain);
      return reply.send(data);
    });

    // GET / (backward compatible — defaults to ethereum)
    app.get("/", async (_request, reply) => {
      const data = queryService.getHealth(protocol, DEFAULT_CHAIN);
      return reply.send(data);
    });
  };
}
