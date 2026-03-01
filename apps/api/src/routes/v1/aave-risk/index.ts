/**
 * API-as-a-Product Layer — Aave Risk Routes
 *
 * Public read-only projection of Aave Risk Intelligence.
 * Hackathon mode: no auth.
 * Strictly decoupled from CRE.
 *
 * Route tree:
 *   GET /health                        → RiskHealthDTO (default: ethereum)
 *   GET /:chain/health                 → RiskHealthDTO
 *   GET /liquidation-pressure          → LiquidationPressureDTO (default: ethereum)
 *   GET /:chain/liquidation-pressure   → LiquidationPressureDTO
 *   GET /user-health/:address          → Legacy user health score
 *   GET /user-risk/:address            → Unified user-risk projection (preferred)
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { RiskQueryService } from "../../../protocols/shared/application/services/risk-query.service.js";
import { Protocol } from "../../../protocols/shared/types/risk-api.types.js";
import { createHealthRoute } from "./health.js";
import { createLiquidationPressureRoute } from "./liquidation-pressure.js";
import { createProjectedHFRoute } from "./projected-hf.js";
import { createProtocolHealthRoute } from "./protocol-health.js";
import { createUserHealthRoute } from "./user-health.js";
import { createUserRiskRoute } from "./user-risk.js";
import { createActionableMetricsRoute } from "./actionable-metrics.js";
import { createStressTestRoute } from "./stress-test.js";

/**
 * Singleton query service — shared across all requests.
 * Multi-protocol, concurrency-safe, lazy-refresh enabled.
 */
const queryService = new RiskQueryService();

export { queryService };

export async function registerAaveRiskApiRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(createHealthRoute(queryService, Protocol.AAVE), {
    prefix: "/health",
  });
  await app.register(
    createLiquidationPressureRoute(queryService, Protocol.AAVE),
    { prefix: "/liquidation-pressure" }
  );

  // Predictive HF projection endpoint
  await app.register(createProjectedHFRoute(), { prefix: "/projected-hf" });

  // Health Score endpoints
  await app.register(createProtocolHealthRoute(), { prefix: "/protocol-health" });
  await app.register(createUserHealthRoute(), { prefix: "/user-health" });
  await app.register(createUserRiskRoute(), { prefix: "/user-risk" });

  // Actionable metrics and stress testing
  await app.register(createActionableMetricsRoute(), { prefix: "/actionable-metrics" });
  await app.register(createStressTestRoute(), { prefix: "/stress-test" });
}
