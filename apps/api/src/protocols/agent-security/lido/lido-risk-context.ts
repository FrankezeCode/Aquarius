/**
 * Lido Risk Context — Domain Layer
 *
 * Bounded context: Agent Security / Lido
 *
 * Defines the Lido-specific risk snapshot consumed by the
 * Lido agent policy guard. Captures staking protocol risk
 * metrics relevant for policy enforcement.
 *
 * DDD role: Value Object (protocol-specific risk data).
 *
 * Design:
 *   - Pure domain type — no infrastructure imports
 *   - Fields capture Lido-specific staking risk metrics
 *   - Intentionally minimal for guard evaluation
 */

// ── Types ────────────────────────────────────────────────────────────

/**
 * Lido-specific risk snapshot for agent policy evaluation.
 *
 * stakingAPR: Current staking annual percentage rate.
 * validatorHealth: Normalized validator health (0..1). Higher = healthier.
 */
export interface LidoRiskSnapshot {
  /** Current staking APR (annual percentage rate). */
  stakingAPR: number;
  /** Normalized validator health score (0..1). */
  validatorHealth: number;
}
