/**
 * GET /api/internal/vault/buffer-health — buffer TVL vs policy, stress projection, optional watch suggestion.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import type { AaveRiskSnapshot } from "../../../protocols/aave/domain/aave-risk-snapshot.js";
import { getBufferSolvencyService } from "../../../infrastructure/buffer-solvency.singleton.js";

const querySchema = z.object({
  stressDrawUsdPerHour: z.coerce.number().positive().max(1e12).optional(),
  horizonHours: z.coerce.number().int().positive().max(8760).optional(),
  /** When `watch`, returns INCREASE_BUFFER suggestion per strategy map (no execution). */
  suggestForRiskLevel: z.enum(["watch"]).optional(),
});

export async function registerVaultBufferHealthRoute(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/buffer-health", async (request, reply) => {
    const parsed = querySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        error: "INVALID_QUERY",
        message: parsed.error.message,
      });
    }
    const { stressDrawUsdPerHour, horizonHours, suggestForRiskLevel } =
      parsed.data;

    let riskSnapshot: AaveRiskSnapshot | undefined;
    if (suggestForRiskLevel === "watch") {
      const now = Date.now();
      riskSnapshot = {
        healthFactor: 1.35,
        debtRatio: 0.35,
        liquidityIndex: -0.02,
        volatilityScore: 0.35,
        riskLevel: "watch",
        timestamp: now,
      };
    }

    const svc = getBufferSolvencyService();
    const body = await svc.getHealth({
      stressDrawUsdPerHour,
      horizonHours,
      riskSnapshot,
    });
    return reply.send(body);
  });
}
