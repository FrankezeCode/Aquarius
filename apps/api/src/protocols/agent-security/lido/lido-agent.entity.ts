/**
 * Lido Agent Entity — Domain Layer
 *
 * Bounded context: Agent Security / Lido
 *
 * Defines the Lido-specific agent identity and capabilities.
 * Controls what staking-level actions the agent is authorized
 * to perform.
 *
 * DDD role: Entity (identity + capability boundary).
 *
 * Design:
 *   - Pure domain type — no infrastructure imports
 *   - Capabilities are Lido-specific (unstake, validator monitoring)
 *   - minValidatorHealthThreshold gates the agent's ability to act
 *     when validator health drops below a certain level
 */

// ── Types ────────────────────────────────────────────────────────────

/**
 * Lido-specific agent capabilities.
 *
 * canTriggerUnstake: Whether the agent can initiate unstaking operations.
 * canMonitorValidators: Whether the agent can perform active validator monitoring.
 * minValidatorHealthThreshold: Minimum validator health the agent is authorized
 *   to act on. If snapshot validatorHealth is below this, agent is NOT authorized.
 */
export interface LidoAgentCapabilities {
  /** Whether this agent can trigger unstaking operations. */
  canTriggerUnstake: boolean;
  /** Whether this agent can perform validator monitoring. */
  canMonitorValidators: boolean;
  /** Minimum validator health threshold the agent can operate under. */
  minValidatorHealthThreshold: number;
}

/**
 * Lido-specific agent identity.
 */
export interface LidoAgent {
  /** Unique agent identifier. */
  id: string;
  /** Lido-specific capabilities and permissions. */
  capabilities: LidoAgentCapabilities;
}
