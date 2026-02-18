/**
 * Agent Policy Guard — Domain Layer
 *
 * Bounded context: Aave / Domain
 *
 * Pure domain validation that enforces agent execution policies.
 * Called by the application layer (EscalationService) before any
 * action is dispatched to infrastructure.
 *
 * DDD role: Domain Service (invariant enforcement).
 *
 * Design:
 *   - Pure function — no side effects, no I/O
 *   - Deterministic — same inputs always produce same result
 *   - Synchronous — zero-cost in the hot path
 *   - Throws on violation (fail-fast, no silent failures)
 *   - No infrastructure imports
 *
 * Validates:
 *   1. Confidentiality authorization
 *   2. Risk level ceiling
 */

import type { Agent } from "./agent.entity.js";
import type { ExecutionContext, RiskLevel } from "../../application/ports/execution.port.js";

// ── Risk hierarchy ───────────────────────────────────────────────────
//
// Ordered from lowest to highest severity. Used for ceiling checks.

const RISK_HIERARCHY: readonly RiskLevel[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

// ── Public API ───────────────────────────────────────────────────────

/**
 * Validate that an agent is authorized to execute the given context.
 *
 * Throws on any policy violation. If this function returns normally,
 * the agent is fully authorized.
 *
 * @throws {Error} If the agent lacks confidential execution rights
 * @throws {Error} If the action's risk level exceeds the agent's ceiling
 */
export function validateAgentExecution(
  agent: Agent,
  context: ExecutionContext
): void {
  // 1. Confidentiality gate
  if (context.requiresConfidentiality && !agent.scope.canExecuteConfidential) {
    throw new Error(
      `Agent "${agent.id}" not authorized for confidential execution`
    );
  }

  // 2. Risk level ceiling
  const agentLevel = RISK_HIERARCHY.indexOf(agent.scope.maxRiskLevel);
  const actionLevel = RISK_HIERARCHY.indexOf(context.riskLevel);

  if (actionLevel > agentLevel) {
    throw new Error(
      `Agent "${agent.id}" risk level exceeded: action requires ${context.riskLevel}, agent max is ${agent.scope.maxRiskLevel}`
    );
  }
}
