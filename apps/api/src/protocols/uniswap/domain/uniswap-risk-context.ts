/**
 * Uniswap Risk Context — Domain Layer
 *
 * Bounded context: Uniswap / Domain
 *
 * Protocol-specific risk snapshot for Uniswap AMM markets.
 * No imports from other protocol contexts.
 *
 * DDD role: Value Object.
 */

export interface UniswapRiskSnapshot {
  /** Expected price impact for reference trade (0..1). */
  priceImpact: number;
  /** Total pool liquidity in USD. */
  poolLiquidity: number;
  /** Normalized volatility (0..1). */
  volatility: number;
}
