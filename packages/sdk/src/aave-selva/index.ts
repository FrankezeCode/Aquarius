/**
 * Aave-Selva — Bounded Context Public API
 *
 * All Aave-specific SDK functionality is exported from here.
 */

export { getAaveRiskSignals, getAaveMarketRisk } from "./risk.js";

export type {
  AaveRiskLevel,
  AaveRiskSignal,
  AaveMarketRiskSummary,
  AaveRiskQuery,
} from "./types.js";
