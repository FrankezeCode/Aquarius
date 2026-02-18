/**
 * Risk-Intelligence — Scorer (ACE Stack)
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Transforms a CorrelatedRiskAssessment into a discrete risk score
 * compatible with the Aquarius Classification Engine (ACE) taxonomy.
 *
 * Score bands:
 *   safe           0.00 – 0.25
 *   watch          0.25 – 0.50
 *   early-warning  0.50 – 0.75
 *   critical       0.75 – 1.00
 *
 * Design:
 *   - Pure function, no side-effects
 *   - Deterministic: same assessment → same score
 */

import type { CorrelatedRiskAssessment } from "./correlator.js";

// ── Types ────────────────────────────────────────────────────────────

/** ACE risk level — mirrors SDK AaveRiskLevel for cross-layer alignment. */
export type AceRiskLevel = "safe" | "watch" | "early-warning" | "critical";

/** Fully scored risk result ready for monitoring / API consumption. */
export interface RiskScore {
  /** Chain this score applies to. */
  chainId: string;
  /** Numeric composite score 0..1 (from correlator). */
  composite: number;
  /** Discrete classification. */
  level: AceRiskLevel;
  /** Human-readable summary for dashboards & alerts. */
  summary: string;
  /** The correlated dimensions that fed into this score. */
  dimensions: CorrelatedRiskAssessment["dimensions"];
  /** Positions sampled. */
  sampleSize: number;
  /** Unix ms. */
  timestamp: number;
}

// ── Thresholds ───────────────────────────────────────────────────────

const THRESHOLDS: { max: number; level: AceRiskLevel }[] = [
  { max: 0.25, level: "safe" },
  { max: 0.50, level: "watch" },
  { max: 0.75, level: "early-warning" },
  { max: 1.01, level: "critical" }, // 1.01 to capture floating-point edge
];

// ── Helpers ──────────────────────────────────────────────────────────

function classify(composite: number): AceRiskLevel {
  for (const t of THRESHOLDS) {
    if (composite < t.max) return t.level;
  }
  return "critical";
}

function buildSummary(
  chainId: string,
  level: AceRiskLevel,
  composite: number,
  sampleSize: number
): string {
  const pct = (composite * 100).toFixed(1);
  switch (level) {
    case "safe":
      return `[${chainId}] Aave risk SAFE — composite ${pct}% across ${sampleSize} positions.`;
    case "watch":
      return `[${chainId}] Aave risk WATCH — composite ${pct}% across ${sampleSize} positions. Monitor closely.`;
    case "early-warning":
      return `[${chainId}] Aave risk EARLY-WARNING — composite ${pct}% across ${sampleSize} positions. Prepare escalation.`;
    case "critical":
      return `[${chainId}] Aave risk CRITICAL — composite ${pct}% across ${sampleSize} positions. Immediate action required.`;
  }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Score a correlated risk assessment using ACE classification bands.
 */
export function scoreRisk(assessment: CorrelatedRiskAssessment): RiskScore {
  const level = classify(assessment.compositeScore);
  return {
    chainId: assessment.chainId,
    composite: assessment.compositeScore,
    level,
    summary: buildSummary(
      assessment.chainId,
      level,
      assessment.compositeScore,
      assessment.sampleSize
    ),
    dimensions: assessment.dimensions,
    sampleSize: assessment.sampleSize,
    timestamp: Date.now(),
  };
}
