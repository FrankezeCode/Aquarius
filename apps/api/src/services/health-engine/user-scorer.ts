/**
 * Health Engine — User Position Health Scorer
 *
 * Computes a user-level health score from on-chain position data.
 *
 * Formula:
 *   Base = normalizeHealthFactor(hf)
 *   Penalty = volatility + concentration + correlation
 *   Score = clamp(Base - Penalty, 0, 100)
 */

import type { UserHealthScore, UserHealthPenalties } from "@aquarius/types";
import { normalizeHealthFactor, classifyScore } from "./scoring.js";

interface UserPositionData {
  healthFactor: number;
  totalCollateralUsd: number;
  totalDebtUsd: number;
  /** Largest single collateral asset as fraction of total (0–1). */
  largestCollateralShare: number;
  /** Whether primary collateral assets are correlated (e.g., ETH + stETH). */
  hasCorrelatedCollateral: boolean;
  /** HF velocity slope (negative = declining). */
  hfSlope: number;
}

/**
 * Compute user-level health score from position data.
 */
export function computeUserHealth(
  user: string,
  protocol: string,
  position: UserPositionData
): UserHealthScore {
  const base = normalizeHealthFactor(position.healthFactor);
  const penalties = computePenalties(position);
  const totalPenalty = penalties.volatility + penalties.concentration + penalties.correlation;
  const score = Math.round(Math.max(0, Math.min(100, base - totalPenalty)));
  const category = classifyScore(score);
  const confidence = computeUserConfidence(position);

  return {
    user,
    protocol,
    score,
    category,
    confidence,
    base,
    penalties,
    reasoning: generateUserReasoning(position, score, penalties),
    metadata: {
      block: null,
      timestamp: new Date().toISOString(),
      sources: ["on-chain-aave-v3", "oracle-feeds"],
    },
  };
}

function computePenalties(position: UserPositionData): UserHealthPenalties {
  let volatility = 0;
  if (position.hfSlope < -0.1) {
    volatility = Math.min(15, Math.round(Math.abs(position.hfSlope) * 30));
  }

  let concentration = 0;
  if (position.largestCollateralShare > 0.7) {
    concentration = Math.round((position.largestCollateralShare - 0.5) * 20);
  }

  const correlation = position.hasCorrelatedCollateral ? 5 : 0;

  return { volatility, concentration, correlation };
}

function computeUserConfidence(position: UserPositionData): number {
  if (position.totalCollateralUsd === 0 && position.totalDebtUsd === 0) {
    return 0.5;
  }
  return 0.85;
}

function generateUserReasoning(
  position: UserPositionData,
  score: number,
  penalties: UserHealthPenalties
): string {
  if (score >= 75) {
    return `Health factor of ${position.healthFactor.toFixed(2)} provides a strong safety buffer. Position is healthy.`;
  }

  const issues: string[] = [];
  if (penalties.volatility > 0) {
    issues.push("declining health factor trajectory");
  }
  if (penalties.concentration > 0) {
    issues.push("high collateral concentration in a single asset");
  }
  if (penalties.correlation > 0) {
    issues.push("correlated collateral exposure");
  }

  if (issues.length === 0) {
    return `Health factor of ${position.healthFactor.toFixed(2)} is approaching risk thresholds. Monitor closely.`;
  }

  return `Health factor of ${position.healthFactor.toFixed(2)} combined with ${issues.join(" and ")} reduces position safety.`;
}

/**
 * Build UserPositionData from raw Aave contract reader output.
 * Provides sensible defaults for fields not available from basic account data.
 */
export function buildPositionData(
  raw: {
    healthFactor: number;
    totalCollateralUsd: number;
    totalDebtUsd: number;
  },
  overrides?: Partial<Pick<UserPositionData, "largestCollateralShare" | "hasCorrelatedCollateral" | "hfSlope">>
): UserPositionData {
  return {
    healthFactor: raw.healthFactor,
    totalCollateralUsd: raw.totalCollateralUsd,
    totalDebtUsd: raw.totalDebtUsd,
    largestCollateralShare: overrides?.largestCollateralShare ?? 0.6,
    hasCorrelatedCollateral: overrides?.hasCorrelatedCollateral ?? false,
    hfSlope: overrides?.hfSlope ?? 0,
  };
}
