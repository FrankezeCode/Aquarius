/**
 * Domain Layer — Barrel Export
 *
 * Bounded context: Aave / Domain
 *
 * Re-exports all domain types and services.
 * AaveRiskSnapshot is the canonical DTO — the single source of truth
 * for Aave risk data consumed by agent-security and AI agents.
 */

export {
  type Agent,
  type AgentScope,
  validateAgentExecution,
} from "./agents/index.js";

export {
  type AaveRiskSnapshot,
} from "./aave-risk-snapshot.js";
