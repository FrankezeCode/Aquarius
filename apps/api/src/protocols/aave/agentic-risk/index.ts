/**
 * Agentic Risk — Barrel Export
 *
 * Bounded context: Aave / Agentic Risk
 *
 * Re-exports agent guard and shared types for AI agent and
 * action layer consumers.
 */

export {
  isAuthorized,
  type ActionType,
  type PermissionScope,
  type GuardDecision,
} from "./agent.guard.js";
