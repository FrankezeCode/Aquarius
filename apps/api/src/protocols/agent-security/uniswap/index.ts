/**
 * Agent Security / Uniswap — Barrel Export
 *
 * Bounded context: Agent Security / Uniswap
 *
 * Re-exports Uniswap-specific agent entities, risk context types,
 * and policy guards.
 */

export {
  type UniswapAgent,
  type UniswapAgentCapabilities,
} from "./uniswap-agent.entity.js";

export {
  type UniswapRiskSnapshot,
} from "./uniswap-risk-context.js";

export {
  validateUniswapAgentExecution,
} from "./uniswap-agent-policy.guard.js";
