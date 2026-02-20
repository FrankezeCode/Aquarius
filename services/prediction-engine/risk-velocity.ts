/**
 * Prediction Engine — Risk Velocity
 *
 * Computes the rate of change of health factor over time.
 * Detects accelerating risk (velocity positive AND increasing).
 *
 * Pure function — no I/O. Operates on historical HF snapshots.
 *
 * Performance target: < 0.1ms per position.
 */

import type { RiskVelocity } from "./types.js";

export interface HFHistoryPoint {
  healthFactor: number;
  block: number;
}

const MIN_DATA_POINTS = 3;

/**
 * Compute risk velocity (HF slope) from historical data points.
 *
 * Uses linear regression over the window to determine the slope.
 * A negative slope means HF is declining (risk increasing).
 *
 * Acceleration is the second derivative: is the decline speeding up?
 */
export function computeRiskVelocity(
  user: string,
  history: HFHistoryPoint[],
  windowBlocks: number = 50
): RiskVelocity {
  if (history.length < MIN_DATA_POINTS) {
    return {
      user,
      slope: 0,
      acceleration: 0,
      isAccelerating: false,
      windowBlocks,
    };
  }

  // Filter to window
  const maxBlock = history[history.length - 1]!.block;
  const windowStart = maxBlock - windowBlocks;
  const windowed = history.filter((p) => p.block >= windowStart);

  if (windowed.length < MIN_DATA_POINTS) {
    return {
      user,
      slope: 0,
      acceleration: 0,
      isAccelerating: false,
      windowBlocks,
    };
  }

  // Linear regression: slope = Σ((x-x̄)(y-ȳ)) / Σ((x-x̄)²)
  const n = windowed.length;
  const meanBlock = windowed.reduce((s, p) => s + p.block, 0) / n;
  const meanHF = windowed.reduce((s, p) => s + p.healthFactor, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (const point of windowed) {
    const dx = point.block - meanBlock;
    const dy = point.healthFactor - meanHF;
    numerator += dx * dy;
    denominator += dx * dx;
  }

  const slope = denominator !== 0
    ? Math.round((numerator / denominator) * 1_000_000) / 1_000_000
    : 0;

  // Compute acceleration from first and second half slopes
  const mid = Math.floor(windowed.length / 2);
  const firstHalf = windowed.slice(0, mid);
  const secondHalf = windowed.slice(mid);

  const firstSlope = computeSimpleSlope(firstHalf);
  const secondSlope = computeSimpleSlope(secondHalf);
  const acceleration = Math.round((secondSlope - firstSlope) * 1_000_000) / 1_000_000;

  // Risk is accelerating if slope is negative AND acceleration is also negative
  const isAccelerating = slope < 0 && acceleration < 0;

  return {
    user,
    slope,
    acceleration,
    isAccelerating,
    windowBlocks,
  };
}

function computeSimpleSlope(points: HFHistoryPoint[]): number {
  if (points.length < 2) return 0;

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const blockDelta = last.block - first.block;

  return blockDelta > 0
    ? (last.healthFactor - first.healthFactor) / blockDelta
    : 0;
}
