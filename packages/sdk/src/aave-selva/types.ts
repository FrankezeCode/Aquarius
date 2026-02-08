/**
 * Aave-Selva — Domain Types
 *
 * Types specific to the Aave bounded context within the Aquarius SDK.
 */

/** Risk level classification for an Aave position or market. */
export type AaveRiskLevel = "safe" | "watch" | "early-warning" | "critical";

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
