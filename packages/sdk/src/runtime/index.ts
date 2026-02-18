/**
 * Selva Runtime — Public API
 *
 * Strategy runtime + guardrails for DeFi automation safety.
 *
 * The runtime is protocol-agnostic.  It only understands
 * EvaluatableRisk — never Aave, Lido, or Uniswap specifics.
 *
 * No domain imports.  No normalization logic.  No HTTP.
 * Pure evaluation.
 */

// Types (runtime boundary contract)
export type {
  ProtocolId,
  RiskMetadata,
  RiskSeverity,
  EvaluatableRisk,
} from "./types.js";

// Errors
export {
  SelvaPolicyViolation,
  SelvaExecutionBlocked,
} from "./errors.js";

// Pluggable store
export { type ExecutionStore, MemoryExecutionStore } from "./store.js";

// Guardrails
export { RiskPolicy, type RiskPolicyConfig } from "./policy.js";
export { ExecutionLimiter } from "./limiter.js";
export { SelvaStrategy } from "./strategy.js";
