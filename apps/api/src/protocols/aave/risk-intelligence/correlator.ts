/**
 * Risk-Intelligence — Signal Correlator
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Correlates multiple risk signals (health-factor pressure, liquidation
 * proximity, market-wide stress) into a single correlated risk assessment.
 *
 * Design:
 *   - Pure functions, no I/O
 *   - Deterministic given the same inputs
 *   - Weights are tunable constants (move to config when going to prod)
 */

import type { AavePositionSnapshot, AaveChainMetrics } from "./signals.js";

// ── Types ────────────────────────────────────────────────────────────

/** Individual signal dimension used by the correlator. */
export interface SignalDimension {
  /** Human-readable label. */
  label: string;
  /** Normalised value 0..1 where 1 = maximum risk. */
  value: number;
  /** Weight applied during correlation. */
  weight: number;
}

/** Output of the correlation step. */
export interface CorrelatedRiskAssessment {
  /** Composite score 0..1. */
  compositeScore: number;
  /** Breakdown per dimension. */
  dimensions: SignalDimension[];
  /** Number of positions that contributed. */
  sampleSize: number;
  /** Chain this assessment belongs to. */
  chainId: string;
  timestamp: number;
}

// ── Weights (tunable) ────────────────────────────────────────────────

const WEIGHT_HF_PRESSURE = 0.40;
const WEIGHT_LIQUIDATION_PROXIMITY = 0.30;
const WEIGHT_MARKET_CONCENTRATION = 0.15;
const WEIGHT_DEBT_RATIO = 0.15;

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Map a health-factor average into a 0..1 risk value.
 * HF <= 1.0 → 1.0 (max risk), HF >= 3.0 → 0.0 (no risk).
 */
function hfToRisk(avgHf: number): number {
  return Math.max(0, Math.min(1, (3.0 - avgHf) / 2.0));
}

/**
 * Fraction of positions whose HF < threshold.
 */
function liquidationPressure(
  positions: AavePositionSnapshot[],
  threshold = 1.25
): number {
  if (positions.length === 0) return 0;
  const atRisk = positions.filter((p) => p.healthFactor < threshold).length;
  return atRisk / positions.length;
}

/**
 * Market concentration: how much of total collateral is held by the
 * top N positions. Higher concentration → higher systemic risk.
 */
function concentrationRisk(
  positions: AavePositionSnapshot[],
  topN = 5
): number {
  if (positions.length === 0) return 0;
  const sorted = [...positions].sort((a, b) => b.collateralUsd - a.collateralUsd);
  const topCollateral = sorted
    .slice(0, topN)
    .reduce((sum, p) => sum + p.collateralUsd, 0);
  const totalCollateral = positions.reduce((sum, p) => sum + p.collateralUsd, 0);
  if (totalCollateral === 0) return 0;
  // If top-N hold >80 % of TVL, risk ≈ 1
  return Math.min(1, (topCollateral / totalCollateral) / 0.8);
}

/**
 * Aggregate debt-to-collateral ratio normalised 0..1.
 * Ratio >= 0.9 → 1.0 risk, ratio <= 0.3 → 0.0 risk.
 */
function debtRatioRisk(metrics: AaveChainMetrics): number {
  if (metrics.totalCollateralUsd === 0) return 0;
  const ratio = metrics.totalDebtUsd / metrics.totalCollateralUsd;
  return Math.max(0, Math.min(1, (ratio - 0.3) / 0.6));
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Correlate a set of position snapshots + chain metrics into a single
 * composite risk assessment.
 */
export function correlateSignals(
  chainId: string,
  positions: AavePositionSnapshot[],
  metrics: AaveChainMetrics
): CorrelatedRiskAssessment {
  const dimensions: SignalDimension[] = [
    {
      label: "Health-Factor Pressure",
      value: hfToRisk(metrics.avgHealthFactor),
      weight: WEIGHT_HF_PRESSURE,
    },
    {
      label: "Liquidation Proximity",
      value: liquidationPressure(positions),
      weight: WEIGHT_LIQUIDATION_PROXIMITY,
    },
    {
      label: "Market Concentration",
      value: concentrationRisk(positions),
      weight: WEIGHT_MARKET_CONCENTRATION,
    },
    {
      label: "Debt-to-Collateral Ratio",
      value: debtRatioRisk(metrics),
      weight: WEIGHT_DEBT_RATIO,
    },
  ];

  const compositeScore =
    Math.round(
      dimensions.reduce((acc, d) => acc + d.value * d.weight, 0) * 10000
    ) / 10000;

  return {
    compositeScore,
    dimensions,
    sampleSize: positions.length,
    chainId,
    timestamp: Date.now(),
  };
}
