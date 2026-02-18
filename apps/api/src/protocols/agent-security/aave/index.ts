/**
 * Agent Security / Aave — Barrel Export
 *
 * Bounded context: Agent Security / Aave
 *
 * Re-exports Aave-specific agent entities, risk context types,
 * and policy guards.
 */

export {
  type AaveAgent,
  type AaveAgentCapabilities,
} from "./aave-agent.entity.js";

export {
  type AaveRiskSnapshot,
} from "./aave-risk-context.js";

export {
  validateAaveAgentExecution,
} from "./aave-agent-policy.guard.js";
