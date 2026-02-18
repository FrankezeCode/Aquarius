/**
 * Lido Risk Context — Domain Layer
 *
 * Bounded context: Lido / Domain
 *
 * Protocol-specific risk snapshot for Lido staking.
 * No imports from other protocol contexts.
 *
 * DDD role: Value Object.
 */

export interface LidoRiskSnapshot {
  /** Current staking APR (annual percentage rate). */
  stakingAPR: number;
  /** Normalized validator health score (0..1). */
  validatorHealth: number;
}
