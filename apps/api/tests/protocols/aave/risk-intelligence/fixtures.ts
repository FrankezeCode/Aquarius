/**
 * Test Fixtures — Deterministic Aave Position Scenarios
 *
 * Provides controlled mock data for every ACE risk band so tests
 * are reproducible regardless of Math.random() in production code.
 *
 * Scenarios:
 *   SAFE       — all HF > 2.5, low debt ratios
 *   WATCH      — mixed HF, some degradation, moderate debt
 *   EARLY_WARN — many HF < 1.25, high debt concentration
 *   CRITICAL   — nearly all HF ≈ 1.0, extreme debt, high concentration
 */

import type {
  AavePositionSnapshot,
  AaveChainMetrics,
} from "../../../../src/protocols/aave/risk-intelligence/signals.js";

// ── Helpers ──────────────────────────────────────────────────────────

function pos(
  owner: string,
  chainId: string,
  hf: number,
  collateral: number
): AavePositionSnapshot {
  const debt = collateral / hf;
  return {
    owner,
    chainId,
    healthFactor: hf,
    collateralUsd: collateral,
    debtUsd: Math.round(debt * 100) / 100,
    liquidationProximity: Math.round(((hf - 1) / hf) * 10000) / 100,
    timestamp: 1_700_000_000_000,
  };
}

// ── SAFE scenario (HF 2.5 – 3.5, low debt) ─────────────────────────

export const SAFE_POSITIONS: AavePositionSnapshot[] = [
  pos("0xSafe01", "ethereum", 3.2, 50_000),
  pos("0xSafe02", "ethereum", 2.8, 40_000),
  pos("0xSafe03", "ethereum", 3.5, 30_000),
  pos("0xSafe04", "ethereum", 2.9, 20_000),
  pos("0xSafe05", "ethereum", 3.0, 60_000),
  pos("0xSafe06", "ethereum", 2.7, 25_000),
  pos("0xSafe07", "ethereum", 3.1, 35_000),
  pos("0xSafe08", "ethereum", 2.6, 45_000),
  pos("0xSafe09", "ethereum", 3.3, 55_000),
  pos("0xSafe10", "ethereum", 2.5, 15_000),
];

// ── WATCH scenario (HF 1.5 – 2.2, moderate debt) ───────────────────

export const WATCH_POSITIONS: AavePositionSnapshot[] = [
  pos("0xWatch01", "ethereum", 1.8, 50_000),
  pos("0xWatch02", "ethereum", 2.0, 40_000),
  pos("0xWatch03", "ethereum", 1.6, 60_000),
  pos("0xWatch04", "ethereum", 2.2, 30_000),
  pos("0xWatch05", "ethereum", 1.9, 55_000),
  pos("0xWatch06", "ethereum", 1.7, 45_000),
  pos("0xWatch07", "ethereum", 2.1, 35_000),
  pos("0xWatch08", "ethereum", 1.5, 50_000),
  pos("0xWatch09", "ethereum", 1.8, 40_000),
  pos("0xWatch10", "ethereum", 2.0, 25_000),
];

// ── EARLY-WARNING scenario (many HF < 1.25, high debt) ─────────────

export const EARLY_WARNING_POSITIONS: AavePositionSnapshot[] = [
  pos("0xEW01", "arbitrum", 1.1, 80_000),
  pos("0xEW02", "arbitrum", 1.05, 90_000),
  pos("0xEW03", "arbitrum", 1.2, 70_000),
  pos("0xEW04", "arbitrum", 1.15, 60_000),
  pos("0xEW05", "arbitrum", 1.08, 85_000),
  pos("0xEW06", "arbitrum", 1.3, 20_000),
  pos("0xEW07", "arbitrum", 1.22, 25_000),
  pos("0xEW08", "arbitrum", 1.12, 75_000),
  pos("0xEW09", "arbitrum", 1.18, 65_000),
  pos("0xEW10", "arbitrum", 1.4, 15_000),
];

// ── CRITICAL scenario (HF ≈ 1.0, extreme debt, whale concentration) ─

export const CRITICAL_POSITIONS: AavePositionSnapshot[] = [
  pos("0xCrit01", "arbitrum", 1.01, 500_000),  // whale
  pos("0xCrit02", "arbitrum", 1.02, 300_000),  // whale
  pos("0xCrit03", "arbitrum", 1.0,  200_000),  // at liquidation
  pos("0xCrit04", "arbitrum", 1.03, 150_000),
  pos("0xCrit05", "arbitrum", 1.01, 100_000),
  pos("0xCrit06", "arbitrum", 1.05, 50_000),
  pos("0xCrit07", "arbitrum", 1.02, 40_000),
  pos("0xCrit08", "arbitrum", 1.04, 30_000),
  pos("0xCrit09", "arbitrum", 1.01, 20_000),
  pos("0xCrit10", "arbitrum", 1.03, 10_000),
];

// ── Empty scenario ──────────────────────────────────────────────────

export const EMPTY_POSITIONS: AavePositionSnapshot[] = [];

// ── Single position edge case ───────────────────────────────────────

export const SINGLE_POSITION: AavePositionSnapshot[] = [
  pos("0xSingle", "base", 1.5, 100_000),
];

// ── Multi-chain scenarios ───────────────────────────────────────────

export const MULTI_CHAIN_SAFE: AavePositionSnapshot[] = [
  pos("0xMC01", "ethereum", 3.0, 50_000),
  pos("0xMC02", "arbitrum", 2.8, 40_000),
  pos("0xMC03", "base", 3.2, 30_000),
];

// ── Pre-computed metrics helpers ────────────────────────────────────

export function metricsFor(
  chainId: string,
  positions: AavePositionSnapshot[]
): AaveChainMetrics {
  if (positions.length === 0) {
    return {
      chainId,
      totalPositions: 0,
      avgHealthFactor: 0,
      medianHealthFactor: 0,
      positionsAtRisk: 0,
      totalCollateralUsd: 0,
      totalDebtUsd: 0,
      timestamp: 1_700_000_000_000,
    };
  }
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const sorted = [...positions].sort((a, b) => a.healthFactor - b.healthFactor);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1]!.healthFactor + sorted[mid]!.healthFactor) / 2
      : sorted[mid]!.healthFactor;

  return {
    chainId,
    totalPositions: positions.length,
    avgHealthFactor:
      Math.round(
        (sum(positions.map((p) => p.healthFactor)) / positions.length) * 1000
      ) / 1000,
    medianHealthFactor: Math.round(median * 1000) / 1000,
    positionsAtRisk: positions.filter((p) => p.healthFactor < 1.25).length,
    totalCollateralUsd:
      Math.round(sum(positions.map((p) => p.collateralUsd)) * 100) / 100,
    totalDebtUsd:
      Math.round(sum(positions.map((p) => p.debtUsd)) * 100) / 100,
    timestamp: 1_700_000_000_000,
  };
}
