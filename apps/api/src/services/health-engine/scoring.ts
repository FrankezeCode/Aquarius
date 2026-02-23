/**
 * Health Engine — Deterministic Scoring
 *
 * Pure functions for computing Health Scores from risk inputs.
 * No I/O, no side-effects, fully deterministic.
 *
 * Scoring model:
 *   Each risk input is 0–100 (higher = more risk)
 *   Final score = 100 - weighted average risk
 *
 * Weights:
 *   volatility:        25%
 *   liquidityRisk:     25%
 *   liquidationRisk:   30%
 *   smartContractRisk: 20%
 *
 * Category thresholds:
 *   score >= 75 → stable
 *   score >= 50 → watch
 *   score <  50 → high_risk
 */

import type {
  HealthCategory,
  HealthScoreResult,
  RiskInputs,
  HealthScoreBreakdown,
} from "@aquarius/types";

// ── Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  volatility: 0.25,
  liquidityRisk: 0.25,
  liquidationRisk: 0.30,
  smartContractRisk: 0.20,
} as const;

// ── Category Classification ─────────────────────────────────────────

export function classifyScore(score: number): HealthCategory {
  if (score >= 75) return "stable";
  if (score >= 50) return "watch";
  return "high_risk";
}

// ── Reasoning Generator ─────────────────────────────────────────────

function generateReasoning(inputs: RiskInputs, score: number): string {
  const factors: Array<{ label: string; value: number }> = [
    { label: "liquidation risk", value: inputs.liquidationRisk },
    { label: "volatility", value: inputs.volatility },
    { label: "liquidity risk", value: inputs.liquidityRisk },
    { label: "smart contract risk", value: inputs.smartContractRisk },
  ];

  factors.sort((a, b) => b.value - a.value);
  const topRisk = factors[0]!;

  if (score >= 75) {
    return `Protocol is healthy. All risk dimensions within safe bounds.`;
  }

  if (score >= 50) {
    return `Elevated ${topRisk.label} (${topRisk.value}/100) is the primary driver of reduced health.`;
  }

  const secondRisk = factors[1]!;
  return `High ${topRisk.label} (${topRisk.value}/100) combined with ${secondRisk.label} (${secondRisk.value}/100) pose significant risk.`;
}

// ── Core Scoring Function ───────────────────────────────────────────

export function calculateHealthScore(inputs: RiskInputs): HealthScoreResult {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const weightedRisk =
    clamp(inputs.volatility) * WEIGHTS.volatility +
    clamp(inputs.liquidityRisk) * WEIGHTS.liquidityRisk +
    clamp(inputs.liquidationRisk) * WEIGHTS.liquidationRisk +
    clamp(inputs.smartContractRisk) * WEIGHTS.smartContractRisk;

  const score = Math.round(100 - weightedRisk);
  const category = classifyScore(score);
  const reasoning = generateReasoning(inputs, score);

  return { score, category, reasoning };
}

// ── Breakdown Builder ───────────────────────────────────────────────

export function buildBreakdown(inputs: RiskInputs): HealthScoreBreakdown {
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, 100 - v)));
  return {
    liquidity: clamp(inputs.liquidityRisk),
    riskConcentration: clamp(inputs.liquidationRisk),
    liquidationRisk: clamp(inputs.liquidationRisk),
    smartContractRisk: clamp(inputs.smartContractRisk),
  };
}

// ── User HF Normalization ───────────────────────────────────────────

/**
 * Map a health factor to a 0–100 base score.
 *   HF <= 1.0  → 0
 *   HF  = 1.5  → 50
 *   HF  = 2.0  → 75
 *   HF >= 3.0  → 100
 */
export function normalizeHealthFactor(hf: number): number {
  if (hf <= 1.0) return 0;
  if (hf >= 3.0) return 100;
  const score = ((hf - 1.0) / 2.0) * 100;
  return Math.round(Math.min(100, score));
}
