/**
 * Aave-Selva — Domain Types
 *
 * Types specific to the Aave bounded context within the Aquarius SDK.
 */

import type { EvaluatableRisk } from "../runtime/types.js";

// ── Risk Level ───────────────────────────────────────────────────────

/** Risk level classification for an Aave position or market. */
export type AaveRiskLevel = "safe" | "watch" | "early-warning" | "critical";

// ── Legacy types (backward compatible) ───────────────────────────────

/** A single Aave risk signal produced by the risk workflow. */
export interface AaveRiskSignal {
  id: string;
  timestamp: number;
  chainId: string;
  riskLevel: AaveRiskLevel;
  healthFactor: number;
  liquidationProximity: number;
  description: string;
}

/** Summary of Aave market risk across a chain. */
export interface AaveMarketRiskSummary {
  chainId: string;
  totalPositions: number;
  atRiskPositions: number;
  averageHealthFactor: number;
  riskLevel: AaveRiskLevel;
}

/** Parameters for querying Aave risk signals. */
export interface AaveRiskQuery {
  chainId?: string;
  riskLevel?: AaveRiskLevel;
  limit?: number;
  offset?: number;
}

// ── Aave Risk Snapshot (extends EvaluatableRisk) ─────────────────────

/**
 * Aave-specific risk snapshot.
 *
 * Extends the universal EvaluatableRisk contract with Aave domain
 * fields.  The Selva Runtime NEVER sees healthFactor or
 * liquidationThreshold — only riskScore and severity.
 */
export interface AaveRiskSnapshot extends EvaluatableRisk {
  /** Aave health factor (< 1.0 = liquidatable). */
  readonly healthFactor: number;
  /** Liquidation threshold percentage. */
  readonly liquidationThreshold: number;
}

// ── Raw API Response (what the backend actually returns) ─────────────

/**
 * Raw shape returned by GET /api/v1/aave-risk/health/:chainId
 *
 * The adapter normalizes this into AaveRiskSnapshot.
 */
export interface AaveRiskApiResponse {
  protocol: string;
  chainId: number;
  timestamp: number;
  healthFactor: number;
  liquidationThreshold: number;
  globalRiskIndex: number;
  liquidationPressure: number;
}

// ── Projected HF Response ───────────────────────────────────────────

/**
 * Response from GET /api/v1/aave-risk/projected-hf/:user
 *
 * Predictive risk assessment for a specific user position.
 */
export interface ProjectedHFResponse {
  user: string;
  currentHF: number;
  projectedHF: number;
  blocksAhead: number;
  confidence: number;
  breachBlock: number | null;
  riskVelocity: {
    slope: number;
    isAccelerating: boolean;
  };
  liquidationProbability: number;
  timestamp: number;
}
