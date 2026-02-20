/**
 * Prediction Engine — Types
 *
 * Pure domain types for predictive risk analysis.
 * No infrastructure imports. No viem. No Node.js APIs.
 */

export interface PositionState {
  user: string;
  collateralUsd: number;
  debtUsd: number;
  healthFactor: number;
  lastBlock: number;
}

export interface OracleState {
  asset: string;
  currentPrice: number;
  previousPrice: number;
  deltaPercent: number;
  velocity: number;
}

export interface HFProjection {
  user: string;
  currentHF: number;
  projectedHF: number;
  blocksAhead: number;
  confidence: number;
  breachBlock: number | null;
}

export interface RiskVelocity {
  user: string;
  slope: number;
  acceleration: number;
  isAccelerating: boolean;
  windowBlocks: number;
}

export interface LiquidationProbability {
  user: string;
  probability: number;
  timeHorizonBlocks: number;
  primaryDriver: "price_volatility" | "debt_growth" | "collateral_decline" | "systemic";
}

export interface StressResult {
  affectedPositions: number;
  totalLossUsd: number;
  avgHFAfterStress: number;
  criticalPositions: Array<{
    user: string;
    currentHF: number;
    stressedHF: number;
    lossUsd: number;
  }>;
}

export interface PredictiveRiskSignal {
  type: "hf_breach_predicted" | "risk_accelerating" | "high_liquidation_prob" | "stress_warning";
  user: string;
  severity: "info" | "warning" | "critical";
  currentHF: number;
  projectedHF: number;
  probability: number;
  blocksToEvent: number | null;
  timestamp: number;
}
