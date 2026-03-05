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
/**
 * Minimal snapshot shape required by the black swan detector.
 * Compatible with RiskScore + AaveChainMetrics but decoupled
 * to avoid tight coupling to the scorer module.
 */
export interface BlackSwanSnapshot {
    /** Chain this snapshot applies to. */
    chainId: string;
    /** Average health factor across sampled positions. */
    avgHealthFactor: number;
    /**
     * Liquidity change as a decimal fraction.
     * -0.25 means liquidity dropped 25% from the previous period.
     * Positive values indicate liquidity growth (no risk).
     */
    liquidityDelta: number;
    /** Number of positions sampled. */
    sampleSize: number;
    /** Unix ms. */
    timestamp: number;
}
/**
 * Detect whether current market conditions constitute a black-swan
 * event.
 *
 * Pure function. Deterministic. No side effects.
 *
 * @returns `true` if black-swan conditions are met, `false` otherwise.
 */
export declare function detectBlackSwan(snapshot: BlackSwanSnapshot): boolean;
//# sourceMappingURL=ai-black-swan-detector.d.ts.map