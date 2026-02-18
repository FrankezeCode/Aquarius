/**
 * Uniswap Risk Context — Domain Layer
 *
 * Bounded context: Agent Security / Uniswap
 *
 * Defines the Uniswap-specific risk snapshot consumed by the
 * Uniswap agent policy guard. Captures DEX-specific market
 * conditions relevant for policy enforcement.
 *
 * DDD role: Value Object (protocol-specific risk data).
 *
 * Design:
 *   - Pure domain type — no infrastructure imports
 *   - Fields capture Uniswap-specific AMM risk metrics
 *   - Intentionally minimal for guard evaluation
 */

// ── Types ────────────────────────────────────────────────────────────

/**
 * Uniswap-specific risk snapshot for agent policy evaluation.
 *
 * priceImpact: Expected price impact for a reference trade size (0..1).
 *   Higher = worse liquidity conditions.
 * poolLiquidity: Total pool liquidity in USD equivalent.
 * volatility: Normalized volatility metric (0..1). Higher = more volatile.
 */
export interface UniswapRiskSnapshot {
  /** Expected price impact for reference trade (0..1). */
  priceImpact: number;
  /** Total pool liquidity in USD. */
  poolLiquidity: number;
  /** Normalized volatility (0..1). */
  volatility: number;
}
