/**
 * Internal — per-domain observability snapshot (no PII).
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getBufferSolvencyService } from "../../infrastructure/buffer-solvency.singleton.js";
import { getKaminoSolanaMetrics } from "../../observability/domain-metrics.js";

export async function registerDomainMetricsRoute(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/domains", async () => {
    const bufferHealth = await getBufferSolvencyService().getHealth();
    return {
      generatedAt: new Date().toISOString(),
      domains: {
        "kamino-solana": getKaminoSolanaMetrics(),
        "aave-buffer": {
          alertLevel: bufferHealth.alertLevel,
          tvlUsd: bufferHealth.tvlUsd,
          gapUsd: bufferHealth.gapUsd,
          minimumTvlUsd: bufferHealth.minimumTvlUsd,
          disclosureKind: bufferHealth.disclosureKind,
          notPublicSla: bufferHealth.notPublicSla,
        },
      },
    };
  });
}
