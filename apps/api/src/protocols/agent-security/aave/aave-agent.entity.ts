/**
 * Aave Agent Entity — Domain Layer
 *
 * Bounded context: Agent Security / Aave
 *
 * Defines the Aave-specific agent identity and its capabilities.
 * Each Aave AI agent is represented by this entity, which controls
 * what protocol-level actions the agent is authorized to perform.
 *
 * DDD role: Entity (identity + capability boundary).
 *
 * Design:
 *   - Pure domain type — no infrastructure imports
 *   - Capabilities are Aave-specific (buffer vault, private settlement)
 *   - maxHealthFactorThreshold gates the agent's ability to act on
 *     positions whose HF is below a certain level
 *   - Complements the generic Agent entity from domain/agents/
 */

// ── Types ────────────────────────────────────────────────────────────

/**
 * Aave-specific agent capabilities.
 *
 * canAdjustBufferVault: Whether the agent can trigger buffer vault operations.
 * canTriggerPrivateSettlement: Whether the agent can request confidential settlements.
 * maxHealthFactorThreshold: Minimum HF the agent is allowed to act on.
 *   If the snapshot HF is below this, the agent is NOT authorized.
 */
export interface AaveAgentCapabilities {
  /** Whether this agent can adjust the buffer vault. */
  canAdjustBufferVault: boolean;
  /** Whether this agent can trigger private settlement flows. */
  canTriggerPrivateSettlement: boolean;
  /** Minimum health factor the agent is authorized to act on. */
  maxHealthFactorThreshold: number;
}

/**
 * Aave-specific agent identity. Extends the generic agent concept
 * with Aave protocol capabilities.
 */
export interface AaveAgent {
  /** Unique agent identifier. */
  id: string;
  /** Aave-specific capabilities and permissions. */
  capabilities: AaveAgentCapabilities;
}
