/**
 * Uniswap-Selva — Domain Types
 *
 * Types specific to the Uniswap bounded context within the Aquarius SDK.
 */

/** A detected arbitrage opportunity across Uniswap pools. */
export interface UniswapArbOpportunity {
  id: string;
  timestamp: number;
  chainId: string;
  poolA: string;
  poolB: string;
  tokenIn: string;
  tokenOut: string;
  profitBps: number;
  estimatedGasUsd: number;
}

/** Summary of Uniswap pool liquidity on a chain. */
export interface UniswapPoolSummary {
  chainId: string;
  totalPools: number;
  totalLiquidityUsd: number;
  top5Pools: string[];
}

/** Parameters for querying Uniswap arb opportunities. */
export interface UniswapArbQuery {
  chainId?: string;
  minProfitBps?: number;
  limit?: number;
  offset?: number;
}
