/**
 * Risk-Intelligence — Signals
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Fetches raw Aave metrics that feed the risk scoring pipeline.
 * Each function returns a lightweight DTO — no heavy deps, no side-effects.
 *
 * Data sources (current):
 *   - Mock / placeholder data for local single-chain POC
 *
 * Data sources (next iteration):
 *   - On-chain adapters via viem / ethers
 *   - Aave subgraph / Aave V3 SDK
 *   - CRE workflow telemetry
 */
/** A single position snapshot fetched from on-chain or cache. */
export interface AavePositionSnapshot {
    /** Wallet or proxy address owning the position. */
    owner: string;
    /** Chain the position lives on. */
    chainId: string;
    /** Current health factor (HF). 1.0 = liquidation threshold. */
    healthFactor: number;
    /** Total collateral value in USD. */
    collateralUsd: number;
    /** Total debt value in USD. */
    debtUsd: number;
    /** Distance (%) from current HF to liquidation (HF = 1). */
    liquidationProximity: number;
    /** Unix ms when this snapshot was taken. */
    timestamp: number;
}
/** Aggregate metrics for a single chain's Aave deployment. */
export interface AaveChainMetrics {
    chainId: string;
    totalPositions: number;
    avgHealthFactor: number;
    medianHealthFactor: number;
    /** Positions with HF < 1.25 (approaching danger). */
    positionsAtRisk: number;
    /** Total collateral across all tracked positions, USD. */
    totalCollateralUsd: number;
    /** Total debt across all tracked positions, USD. */
    totalDebtUsd: number;
    timestamp: number;
}
/**
 * @deprecated Use IMarketDataProvider.fetchPositionSnapshots() via
 * createMarketDataProvider() instead. Kept for backward compatibility
 * with the AaveMonitor legacy path.
 */
export declare function fetchPositionSnapshots(chainId: string, limit?: number): Promise<AavePositionSnapshot[]>;
/**
 * Derive aggregate chain metrics from a set of position snapshots.
 *
 * Pure function — no I/O.
 */
export declare function deriveChainMetrics(chainId: string, positions: AavePositionSnapshot[]): AaveChainMetrics;
/**
 * High-level convenience: fetch + derive in one call.
 */
export declare function fetchChainMetrics(chainId: string, positionLimit?: number): Promise<AaveChainMetrics>;
//# sourceMappingURL=signals.d.ts.map