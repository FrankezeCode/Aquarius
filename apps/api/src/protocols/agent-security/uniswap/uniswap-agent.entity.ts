/**
 * Uniswap Agent Entity — Domain Layer
 *
 * Bounded context: Agent Security / Uniswap
 *
 * Defines the Uniswap-specific agent identity and capabilities.
 * Controls what AMM-level actions the agent is authorized to perform.
 *
 * DDD role: Entity (identity + capability boundary).
 *
 * Design:
 *   - Pure domain type — no infrastructure imports
 *   - Capabilities are Uniswap-specific (LP rebalancing, MEV protection)
 *   - maxPriceImpactThreshold caps the market conditions the agent
 *     is authorized to operate in
 */

// ── Types ────────────────────────────────────────────────────────────

/**
 * Uniswap-specific agent capabilities.
 *
 * canRebalanceLiquidity: Whether the agent can trigger LP position rebalancing.
 * canTriggerMEVProtection: Whether the agent can activate MEV protection.
 * maxPriceImpactThreshold: Maximum price impact the agent is authorized to
 *   act under. If snapshot priceImpact exceeds this, agent is NOT authorized.
 */
export interface UniswapAgentCapabilities {
  /** Whether this agent can rebalance LP positions. */
  canRebalanceLiquidity: boolean;
  /** Whether this agent can activate MEV protection. */
  canTriggerMEVProtection: boolean;
  /** Maximum price impact threshold the agent can operate under. */
  maxPriceImpactThreshold: number;
}

/**
 * Uniswap-specific agent identity.
 */
export interface UniswapAgent {
  /** Unique agent identifier. */
  id: string;
  /** Uniswap-specific capabilities and permissions. */
  capabilities: UniswapAgentCapabilities;
}
