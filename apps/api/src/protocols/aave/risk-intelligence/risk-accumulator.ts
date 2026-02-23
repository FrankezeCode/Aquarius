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

export const DEFAULT_ACCUMULATOR_CONFIG: AccumulatorConfig = {
  decayRatePerSecond: 0.5,
  maxAccumulator: 100,
  dimensionThresholds: {
    "Health-Factor Pressure": 0.50,
    "Liquidation Proximity": 0.40,
    "Market Concentration": 0.60,
    "Debt-to-Collateral Ratio": 0.60,
  },
};

export interface AccumulatorState {
  value: number;
  lastUpdatedAt: number;
  convergentDimensions: string[];
}

export function createInitialAccumulatorState(): AccumulatorState {
  return {
    value: 0,
    lastUpdatedAt: Date.now(),
    convergentDimensions: [],
  };
}

/**
 * Update the risk accumulator with new composite score and dimensions.
 *
 * 1. Apply time-based decay since last update
 * 2. Check convergence (which dimensions exceed their thresholds)
 * 3. Accumulate: composite * amplifier (amplifier grows with convergence)
 * 4. Clamp to [0, maxAccumulator]
 */
export function updateAccumulator(
  current: AccumulatorState,
  composite: number,
  dimensions: ReadonlyArray<{ label: string; value: number; weight: number }>,
  now: number,
  config: AccumulatorConfig = DEFAULT_ACCUMULATOR_CONFIG,
): AccumulatorState {
  const elapsedMs = Math.max(0, now - current.lastUpdatedAt);
  const elapsedSeconds = elapsedMs / 1000;

  // 1. Decay
  const decayed = Math.max(0, current.value - config.decayRatePerSecond * elapsedSeconds);

  // 2. Convergence check
  const convergentDimensions: string[] = [];
  for (const dim of dimensions) {
    const threshold = config.dimensionThresholds[dim.label];
    if (threshold !== undefined && dim.value > threshold) {
      convergentDimensions.push(dim.label);
    }
  }

  // 3. Accumulate with convergence amplifier
  // Base: composite scaled to accumulator units (composite is 0..1, accumulator is 0..100)
  // Amplifier: 1.0 + 0.25 per convergent dimension (more convergence = faster accumulation)
  const amplifier = 1.0 + convergentDimensions.length * 0.25;
  const increment = composite * amplifier * 5; // 5 = scaling factor so mid-range composite accumulates meaningfully

  const newValue = Math.min(config.maxAccumulator, decayed + increment);

  return {
    value: Math.round(newValue * 100) / 100,
    lastUpdatedAt: now,
    convergentDimensions,
  };
}

/**
 * Check if the accumulator meets convergence requirements
 * (minimum number of elevated dimensions).
 */
export function meetsConvergence(
  state: AccumulatorState,
  minDimensions: number,
): boolean {
  return state.convergentDimensions.length >= minDimensions;
}
