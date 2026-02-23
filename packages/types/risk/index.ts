/**
 * Risk — Barrel Export
 *
 * Canonical risk type hierarchy for the Aquarius ecosystem.
 */

// Base (runtime-safe)
export type {
  ProtocolId,
  RiskMetadata,
  RiskSeverity,
  EvaluatableRisk,
} from "./base.js";

// Protocol bounded contexts (adapter-side only)
export type { AaveRiskSnapshot } from "./aave.js";
export type { LidoRiskSnapshot } from "./lido.js";
export type { UniswapRiskSnapshot } from "./uniswap.js";

// Health Score system
export type {
  HealthCategory,
  HealthScoreResult,
  RiskInputs,
  ProtocolHealthScore,
  HealthScoreBreakdown,
  HealthScoreMetadata,
  UserHealthScore,
  UserHealthPenalties,
  MarketRegime,
  AIContextInput,
  AIContextResult,
} from "./health-score.js";
