/**
 * AI Agents — Black Swan Detector
 *
 * Bounded context: Aave / AI Agents
 *
 * Pure, deterministic function that detects black-swan conditions
 * from a risk snapshot. A black swan is defined as:
 *
 *   liquidity drop > 20%  AND  average health factor < 1.1
 *
 * This represents a sudden, extreme market dislocation where
 * collateral values are collapsing faster than positions can be
 * unwound.
 *
 * DDD role: Domain Service (pure computation).
 *
 * Design:
 *   - Pure function — no side effects, no I/O
 *   - Deterministic — same input always produces same output
 *   - Synchronous — zero-cost in the hot path
 *   - No imports from infrastructure layers
 */
// ── Thresholds ───────────────────────────────────────────────────────
/**
 * Black swan triggers when BOTH conditions are met simultaneously:
 *   1. Liquidity dropped more than 20% (delta < -0.20)
 *   2. Average health factor is below 1.1 (near mass liquidation)
 */
const LIQUIDITY_DROP_THRESHOLD = -0.20;
const HEALTH_FACTOR_THRESHOLD = 1.1;
// ── Public API ───────────────────────────────────────────────────────
/**
 * Detect whether current market conditions constitute a black-swan
 * event.
 *
 * Pure function. Deterministic. No side effects.
 *
 * @returns `true` if black-swan conditions are met, `false` otherwise.
 */
export function detectBlackSwan(snapshot) {
    // Both conditions must be true simultaneously
    const liquidityShock = snapshot.liquidityDelta <= LIQUIDITY_DROP_THRESHOLD;
    const healthFactorCritical = snapshot.avgHealthFactor < HEALTH_FACTOR_THRESHOLD;
    return liquidityShock && healthFactorCritical;
}
