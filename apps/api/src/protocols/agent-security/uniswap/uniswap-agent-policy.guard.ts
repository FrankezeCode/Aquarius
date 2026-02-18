/**
 * Uniswap Agent Policy Guard — Domain Layer
 *
 * Bounded context: Agent Security / Uniswap
 *
 * Pure domain validation that enforces Uniswap-specific agent
 * execution policies. Called by the EscalationService when a
 * protocol-aware escalation is requested for Uniswap.
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
 *   1. Price impact does not exceed agent's maxPriceImpactThreshold
 */

import type { UniswapAgent } from "./uniswap-agent.entity.js";
import type { UniswapRiskSnapshot } from "./uniswap-risk-context.js";

// ── Public API ───────────────────────────────────────────────────────

/**
 * Validate that a Uniswap agent is authorized to act on the given
 * risk snapshot.
 *
 * Rule: The snapshot's price impact must not exceed the agent's
 * configured maxPriceImpactThreshold. This prevents agents from
 * operating in extreme market conditions beyond their authorization.
 *
 * @throws {Error} If the price impact exceeds the agent's threshold
 */
export function validateUniswapAgentExecution(
  agent: UniswapAgent,
  snapshot: UniswapRiskSnapshot
): void {
  if (snapshot.priceImpact > agent.capabilities.maxPriceImpactThreshold) {
    throw new Error(
      `Uniswap agent "${agent.id}" not authorized: price impact ${snapshot.priceImpact} ` +
        `exceeds threshold ${agent.capabilities.maxPriceImpactThreshold}`
    );
  }
}
