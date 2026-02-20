/**
 * Prediction Engine — Liquidation Probability
 *
 * Computes the probability of liquidation within a time horizon.
 * Combines HF projection, volatility, and risk velocity into
 * a single 0-1 probability score.
 *
 * Pure function — no I/O.
 *
 * Performance target: < 0.1ms per position.
 */

import type {
  PositionState,
  HFProjection,
  RiskVelocity,
  LiquidationProbability,
} from "./types.js";

const CRITICAL_HF = 1.05;
const WARNING_HF = 1.15;

interface VolatilityInput {
  asset: string;
  annualizedVol: number;
}

/**
 * Compute liquidation probability for a single position.
 *
 * Inputs:
 *   - Current position state
 *   - HF projection (from hf-projection.ts)
 *   - Risk velocity (from risk-velocity.ts)
 *   - Asset volatility estimates
 *
 * Model: weighted combination of:
 *   - Distance to liquidation (HF proximity to 1.0)
 *   - Projected trajectory (is HF heading toward 1.0?)
 *   - Velocity acceleration (is decline speeding up?)
 *   - Volatility risk (can a normal price move trigger liquidation?)
 */
export function computeLiquidationProbability(
  position: PositionState,
  projection: HFProjection,
  velocity: RiskVelocity,
  volatility: VolatilityInput[] = [],
  timeHorizonBlocks: number = 50
): LiquidationProbability {
  if (position.debtUsd <= 0 || position.healthFactor >= 999) {
    return {
      user: position.user,
      probability: 0,
      timeHorizonBlocks,
      primaryDriver: "price_volatility",
    };
  }

  // Factor 1: HF proximity (higher when closer to 1.0)
  const hfBuffer = Math.max(0, position.healthFactor - 1.0);
  const proximityScore = hfBuffer < 0.5
    ? 1.0 - (hfBuffer / 0.5)
    : 0;

  // Factor 2: Projection trajectory (higher when projected HF is lower)
  let trajectoryScore = 0;
  if (projection.projectedHF < position.healthFactor) {
    trajectoryScore = projection.projectedHF < CRITICAL_HF
      ? 0.9
      : projection.projectedHF < WARNING_HF
        ? 0.5
        : 0.2;
  }

  // Factor 3: Velocity acceleration (higher when decline is speeding up)
  const accelerationScore = velocity.isAccelerating
    ? Math.min(1.0, Math.abs(velocity.acceleration) * 10000)
    : 0;

  // Factor 4: Volatility risk (can a single-block price move push HF below 1?)
  let volatilityScore = 0;
  if (volatility.length > 0) {
    const avgVol = volatility.reduce((s, v) => s + v.annualizedVol, 0) / volatility.length;
    const dailyVol = avgVol / Math.sqrt(365);
    const blockVol = dailyVol / Math.sqrt(7200); // ~7200 blocks per day
    const multiBlockVol = blockVol * Math.sqrt(timeHorizonBlocks);

    // If multi-block volatility can eat the HF buffer
    if (multiBlockVol > 0 && hfBuffer > 0) {
      volatilityScore = Math.min(1.0, multiBlockVol / (hfBuffer * 100));
    }
  }

  // Weighted combination
  const probability = Math.min(1.0, Math.max(0,
    proximityScore * 0.35 +
    trajectoryScore * 0.30 +
    accelerationScore * 0.15 +
    volatilityScore * 0.20
  ));

  // Determine primary driver
  const drivers = [
    { score: volatilityScore, driver: "price_volatility" as const },
    { score: trajectoryScore, driver: "collateral_decline" as const },
    { score: accelerationScore, driver: "debt_growth" as const },
    { score: proximityScore, driver: "systemic" as const },
  ];
  drivers.sort((a, b) => b.score - a.score);

  return {
    user: position.user,
    probability: Math.round(probability * 10000) / 10000,
    timeHorizonBlocks,
    primaryDriver: drivers[0]!.driver,
  };
}
