/**
 * Aave Agent Policy Guard — Security Policy Layer
 *
 * Bounded context: Agent Security / Aave
 *
 * Pure security policy validation that enforces Aave-specific agent
 * execution policies. Called by the application layer (EscalationService)
 * when a protocol-aware escalation is requested for Aave.
 *
 * DDD role: Security Policy Service (invariant enforcement).
 *
 * CRITICAL DDD BOUNDARY RULES:
 *   - This guard does NOT recompute risk scores
 *   - This guard does NOT contain scoring formulas
 *   - This guard does NOT duplicate thresholds from risk-intelligence
 *   - This guard ONLY reads pre-computed fields from AaveRiskSnapshot
 *   - AaveRiskSnapshot is defined ONCE in protocols/aave/domain/
 *
 * Design:
 *   - Pure function — no side effects, no I/O
 *   - Deterministic — same inputs always produce same result
 *   - Synchronous — zero-cost in the hot path
 *   - Throws on violation (fail-fast, no silent failures)
 *   - No infrastructure imports
 *
 * Validates:
 *   1. Agent's maxHealthFactorThreshold against snapshot HF
 *      (agent can only act when HF >= threshold)
 */

import type { AaveAgent } from "./aave-agent.entity.js";
import type { AaveRiskSnapshot } from "./aave-risk-context.js";

// ── Public API ───────────────────────────────────────────────────────

/**
 * Validate that an Aave agent is authorized to act on the given
 * risk snapshot.
 *
 * This function applies SECURITY POLICY only — it compares the
 * agent's configured threshold against the already-computed snapshot.
 * All risk computation happens in risk-intelligence/ (scorer, correlator).
 *
 * Rule: The snapshot's health factor must be at or above the agent's
 * configured maxHealthFactorThreshold. This prevents under-qualified
 * agents from acting on critically unhealthy positions.
 *
 * @throws {Error} If the health factor is below the agent's threshold
 */
export function validateAaveAgentExecution(
  agent: AaveAgent,
  snapshot: AaveRiskSnapshot
): void {
  if (snapshot.healthFactor < agent.capabilities.maxHealthFactorThreshold) {
    throw new Error(
      `Aave agent "${agent.id}" not authorized: health factor ${snapshot.healthFactor} ` +
        `is below threshold ${agent.capabilities.maxHealthFactorThreshold}`
    );
  }
}
