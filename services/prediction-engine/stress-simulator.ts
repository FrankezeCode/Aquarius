/**
 * Prediction Engine — Stress Simulator
 *
 * Runs hypothetical scenarios against position snapshots.
 * "What if ETH drops 20%?" -> computes affected positions and aggregate loss.
 *
 * Pure function — read-only analysis, no state mutation.
 * Called on-demand by API or scheduler, NOT in the hot path.
 *
 * Performance target: < 10ms for 1000 positions.
 */

import type { PositionState, StressResult } from "./types.js";

export interface StressScenario {
  name: string;
  priceChanges: Record<string, number>;
}

export const PRESET_SCENARIOS: Record<string, StressScenario> = {
  eth_drop_10: {
    name: "ETH -10%",
    priceChanges: { WETH: -10 },
  },
  eth_drop_20: {
    name: "ETH -20%",
    priceChanges: { WETH: -20 },
  },
  eth_drop_30: {
    name: "ETH -30%",
    priceChanges: { WETH: -30 },
  },
  btc_drop_15: {
    name: "BTC -15%",
    priceChanges: { WBTC: -15 },
  },
  broad_crash: {
    name: "Broad market -25%",
    priceChanges: { WETH: -25, WBTC: -25, DAI: -1, USDC: -0.5 },
  },
  depeg_usdc: {
    name: "USDC depeg to $0.95",
    priceChanges: { USDC: -5 },
  },
};

/**
 * Simulate a stress scenario against a set of positions.
 *
 * For each position, apply price changes to estimate new HF.
 * Positions with stressed HF < 1.0 are flagged as liquidatable.
 */
export function runStressTest(
  positions: PositionState[],
  scenario: StressScenario
): StressResult {
  const criticalPositions: StressResult["criticalPositions"] = [];
  let totalLossUsd = 0;
  let totalStressedHF = 0;
  let activeCount = 0;

  for (const pos of positions) {
    if (pos.debtUsd <= 0) continue;
    activeCount++;

    // Apply worst-case price change to collateral
    // Assume collateral is primarily denominated in the stressed asset
    let maxImpact = 0;
    for (const [, change] of Object.entries(scenario.priceChanges)) {
      maxImpact = Math.min(maxImpact, change);
    }

    const collateralImpact = maxImpact / 100;
    const stressedCollateral = pos.collateralUsd * (1 + collateralImpact);
    const stressedHF = stressedCollateral / pos.debtUsd;

    totalStressedHF += stressedHF;

    if (stressedHF < 1.0) {
      const lossUsd = pos.debtUsd - stressedCollateral;
      totalLossUsd += Math.max(0, lossUsd);

      criticalPositions.push({
        user: pos.user,
        currentHF: pos.healthFactor,
        stressedHF: Math.round(stressedHF * 1000) / 1000,
        lossUsd: Math.round(lossUsd * 100) / 100,
      });
    }
  }

  criticalPositions.sort((a, b) => a.stressedHF - b.stressedHF);

  return {
    affectedPositions: criticalPositions.length,
    totalLossUsd: Math.round(totalLossUsd * 100) / 100,
    avgHFAfterStress: activeCount > 0
      ? Math.round((totalStressedHF / activeCount) * 1000) / 1000
      : 0,
    criticalPositions: criticalPositions.slice(0, 50),
  };
}
