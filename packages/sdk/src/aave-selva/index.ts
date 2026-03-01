/**
 * Aave-Selva — Bounded Context Public API
 *
 * All Aave-specific SDK functionality is exported from here.
 */

// Adapter
export { AaveRiskAdapter } from "./risk.js";

// Convenience functions
export { getRisk, guard } from "./risk.js";

// Legacy (backward compatible)
export { getAaveRiskSignals, getAaveMarketRisk } from "./risk.js";

// Predictive risk
export { getProjectedHF } from "./projected-hf.js";

// Health Score
export { getProtocolHealth, getUserHealth, getUserRisk } from "./health-score.js";

// Domain types
export type {
  AaveRiskLevel,
  AaveRiskSignal,
  AaveMarketRiskSummary,
  AaveRiskQuery,
  AaveRiskSnapshot,
  AaveRiskApiResponse,
  ProjectedHFResponse,
  HealthCategory,
  HealthFactorDirection,
  MarketRegime,
  ProtocolHealthScore,
  UserHealthScore,
  UserRiskResponse,
  HealthScoreBreakdown,
  HealthScoreMetadata,
} from "./types.js";
