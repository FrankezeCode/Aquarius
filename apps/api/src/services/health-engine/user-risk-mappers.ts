import type { HealthFactorDirection, UserHealthScore } from "@aquarius/types";

export function computeLiquidationDistancePct(healthFactor: number): number {
  if (!Number.isFinite(healthFactor) || healthFactor <= 1) return 0;
  return Math.round(((healthFactor - 1) / healthFactor) * 10000) / 100;
}

export function deriveHealthFactorDirection(hfSlope: number): HealthFactorDirection {
  if (hfSlope <= -0.03) return "down";
  if (hfSlope >= 0.03) return "up";
  return "neutral";
}

export function buildAgentRecommendation(
  category: UserHealthScore["category"],
  healthFactor: number
): string {
  if (category === "high_risk" || healthFactor < 1.2) {
    return "Immediate action required: add collateral or reduce debt now.";
  }
  if (category === "watch" || healthFactor < 1.6) {
    return "Add collateral to restore a healthier liquidation buffer.";
  }
  return "Position is healthy. No action required.";
}
