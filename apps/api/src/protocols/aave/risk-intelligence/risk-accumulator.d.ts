/**
 * Risk Accumulator — Signal Stacking with Decay & Convergence
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Maintains a weighted risk accumulation value that:
 *   - Increases proportionally to composite risk + convergence amplifier
 *   - Decays over time to prevent stale signal persistence
 *   - Tracks which dimensions are above their individual thresholds (convergence)
 *   - Uses hysteresis bands to prevent stage flapping
 *
 * Pure domain logic. No infrastructure imports.
 */
export interface AccumulatorConfig {
    /** Decay rate per second (accumulator units). */
    decayRatePerSecond: number;
    /** Maximum accumulator value. */
    maxAccumulator: number;
    /** Per-dimension thresholds for convergence detection. */
    dimensionThresholds: Record<string, number>;
}
export declare const DEFAULT_ACCUMULATOR_CONFIG: AccumulatorConfig;
export interface AccumulatorState {
    value: number;
    lastUpdatedAt: number;
    convergentDimensions: string[];
}
export declare function createInitialAccumulatorState(): AccumulatorState;
/**
 * Update the risk accumulator with new composite score and dimensions.
 *
 * 1. Apply time-based decay since last update
 * 2. Check convergence (which dimensions exceed their thresholds)
 * 3. Accumulate: composite * amplifier (amplifier grows with convergence)
 * 4. Clamp to [0, maxAccumulator]
 */
export declare function updateAccumulator(current: AccumulatorState, composite: number, dimensions: ReadonlyArray<{
    label: string;
    value: number;
    weight: number;
}>, now: number, config?: AccumulatorConfig): AccumulatorState;
/**
 * Check if the accumulator meets convergence requirements
 * (minimum number of elevated dimensions).
 */
export declare function meetsConvergence(state: AccumulatorState, minDimensions: number): boolean;
//# sourceMappingURL=risk-accumulator.d.ts.map