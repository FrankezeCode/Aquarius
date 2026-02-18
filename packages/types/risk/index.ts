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
