/**
 * Domain / Agents — Barrel Export
 *
 * Bounded context: Aave / Domain
 *
 * Re-exports agent entity and policy guard for application-layer
 * consumers.
 */

export { type Agent, type AgentScope } from "./agent.entity.js";

export { validateAgentExecution } from "./agent-policy.guard.js";
