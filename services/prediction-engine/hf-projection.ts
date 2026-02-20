/**
 * Prediction Engine — HF Projection
 *
 * Projects health factor forward using oracle price velocity
 * and collateral composition. Pure function — no I/O.
 *
 * Model: linear extrapolation with collateral beta weighting.
 *
 * If projectedHF(block + N) < threshold, the position is
 * at risk BEFORE a static HF check would detect it.
 *
 * Performance target: < 0.1ms per position.
 */

import type { PositionState, OracleState, HFProjection } from "./types.js";

const DEFAULT_BLOCKS_AHEAD = 5;
const BLOCK_TIME_SECONDS = 12;
const MIN_CONFIDENCE = 0.5;
const MAX_CONFIDENCE = 0.95;

/**
 * Project HF for a single position given oracle velocity data.
 *
 * The projection uses price velocity to estimate future collateral
 * and debt values, assuming velocity remains constant over the window.
 */
export function projectHF(
  position: PositionState,
  oracleStates: OracleState[],
  blocksAhead: number = DEFAULT_BLOCKS_AHEAD
): HFProjection {
  if (position.debtUsd <= 0 || position.healthFactor <= 0) {
    return {
      user: position.user,
      currentHF: position.healthFactor,
      projectedHF: position.healthFactor,
      blocksAhead,
      confidence: MAX_CONFIDENCE,
      breachBlock: null,
    };
  }

  // Compute weighted price impact on collateral and debt
  let collateralDeltaPercent = 0;
  let debtDeltaPercent = 0;

  for (const oracle of oracleStates) {
    const velocityPerBlock = oracle.velocity / BLOCK_TIME_SECONDS * BLOCK_TIME_SECONDS;
    const projectedDelta = velocityPerBlock * blocksAhead;

    // Collateral goes down when prices drop, debt goes up when borrowed asset prices rise
    // For simplicity: assume collateral is denominated in volatile assets,
    // debt is denominated in stablecoins (most common Aave V3 pattern)
    collateralDeltaPercent += projectedDelta * 0.8; // 80% exposure assumed
  }

  // Project future values
  const futureCollateralUsd = position.collateralUsd * (1 + collateralDeltaPercent / 100);
  const futureDebtUsd = position.debtUsd * (1 + debtDeltaPercent / 100);

  const projectedHF = futureDebtUsd > 0
    ? Math.round((futureCollateralUsd / futureDebtUsd) * 1000) / 1000
    : 999;

  // Confidence decreases as we project further ahead
  const confidence = Math.max(
    MIN_CONFIDENCE,
    MAX_CONFIDENCE - (blocksAhead * 0.02)
  );

  // Estimate breach block (when HF would cross 1.0)
  let breachBlock: number | null = null;
  if (projectedHF < position.healthFactor && projectedHF < 1.1) {
    const hfDeltaPerBlock = (position.healthFactor - projectedHF) / blocksAhead;
    if (hfDeltaPerBlock > 0) {
      const blocksToOne = (position.healthFactor - 1.0) / hfDeltaPerBlock;
      breachBlock = position.lastBlock + Math.ceil(blocksToOne);
    }
  }

  return {
    user: position.user,
    currentHF: position.healthFactor,
    projectedHF,
    blocksAhead,
    confidence,
    breachBlock,
  };
}

/**
 * Batch project HF for multiple positions.
 * Returns only positions where projection shows decline.
 */
export function projectMultiple(
  positions: PositionState[],
  oracleStates: OracleState[],
  blocksAhead: number = DEFAULT_BLOCKS_AHEAD
): HFProjection[] {
  return positions
    .map((p) => projectHF(p, oracleStates, blocksAhead))
    .filter((proj) => proj.projectedHF < proj.currentHF);
}
