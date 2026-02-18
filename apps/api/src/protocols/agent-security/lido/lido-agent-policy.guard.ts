/**
 * Lido Agent Policy Guard — Domain Layer
 *
 * Bounded context: Agent Security / Lido
 *
 * Pure domain validation that enforces Lido-specific agent
 * execution policies. Called by the EscalationService when a
 * protocol-aware escalation is requested for Lido.
 *
 * DDD role: Domain Service (invariant enforcement).
 *
 * Design:
 *   - Pure function — no side effects, no I/O
 *   - Deterministic — same inputs always produce same result
 *   - Synchronous — zero-cost in the hot path
 *   - Throws on violation (fail-fast)
 *   - No infrastructure imports
 *
 * Validates:
 *   1. Validator health meets agent's minValidatorHealthThreshold
 */

import type { LidoAgent } from "./lido-agent.entity.js";
import type { LidoRiskSnapshot } from "./lido-risk-context.js";

// ── Public API ───────────────────────────────────────────────────────

/**
 * Validate that a Lido agent is authorized to act on the given
 * risk snapshot.
 *
 * Rule: The snapshot's validator health must be at or above the
 * agent's configured minValidatorHealthThreshold. This prevents
 * agents from acting on validators in conditions beyond their
 * authorization level.
 *
 * @throws {Error} If validator health is below the agent's threshold
 */
export function validateLidoAgentExecution(
  agent: LidoAgent,
  snapshot: LidoRiskSnapshot
): void {
  if (snapshot.validatorHealth < agent.capabilities.minValidatorHealthThreshold) {
    throw new Error(
      `Lido agent "${agent.id}" not authorized: validator health ${snapshot.validatorHealth} ` +
        `is below threshold ${agent.capabilities.minValidatorHealthThreshold}`
    );
  }
}
