/**
 * Prediction Engine — Barrel Export
 *
 * Pure domain services for predictive risk analysis.
 * No infrastructure imports. Stateless computation.
 */

export { projectHF, projectMultiple } from "./hf-projection.js";
export { computeRiskVelocity } from "./risk-velocity.js";
export { computeLiquidationProbability } from "./liquidation-probability.js";
export { runStressTest, PRESET_SCENARIOS } from "./stress-simulator.js";
export { VolatilityForecaster } from "./volatility-forecast.js";

export type {
  PositionState,
  OracleState,
  HFProjection,
  RiskVelocity,
  LiquidationProbability,
  StressResult,
  PredictiveRiskSignal,
} from "./types.js";
