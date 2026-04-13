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

// CRE escalation (shared kernel)
export type { CreEscalationStage } from "./cre.js";

// Protocol bounded contexts (adapter-side only)
export type { AaveRiskSnapshot } from "./aave.js";
export type { LidoRiskSnapshot } from "./lido.js";
export type { UniswapRiskSnapshot } from "./uniswap.js";
export type { KaminoRiskSnapshot, KaminoRiskMetadata } from "./kamino.js";

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
  HealthFactorDirection,
  UserRiskResponse,
  MarketRegime,
  AIContextInput,
  AIContextResult,
} from "./health-score.js";
