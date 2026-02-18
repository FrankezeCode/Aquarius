/**
 * Agent Security / Lido — Barrel Export
 *
 * Bounded context: Agent Security / Lido
 *
 * Re-exports Lido-specific agent entities, risk context types,
 * and policy guards.
 */

export {
  type LidoAgent,
  type LidoAgentCapabilities,
} from "./lido-agent.entity.js";

export {
  type LidoRiskSnapshot,
} from "./lido-risk-context.js";

export {
  validateLidoAgentExecution,
} from "./lido-agent-policy.guard.js";
