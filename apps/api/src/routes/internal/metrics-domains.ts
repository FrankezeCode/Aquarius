/**
 * Internal — per-domain observability snapshot (no PII).
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getKaminoSolanaMetrics } from "../../observability/domain-metrics.js";

export async function registerDomainMetricsRoute(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/domains", async () => {
    return {
      generatedAt: new Date().toISOString(),
      domains: {
        "kamino-solana": getKaminoSolanaMetrics(),
      },
    };
  });
}
