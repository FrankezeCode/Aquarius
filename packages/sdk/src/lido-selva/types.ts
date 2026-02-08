/**
 * Lido-Selva — Domain Types
 *
 * Types specific to the Lido bounded context within the Aquarius SDK.
 */

/** A Lido staking position snapshot. */
export interface LidoStakingPosition {
  id: string;
  timestamp: number;
  chainId: string;
  stakedEth: number;
  stEthBalance: number;
  rewardsAccrued: number;
  apr: number;
}

/** Summary of Lido staking metrics on a chain. */
export interface LidoStakingSummary {
  chainId: string;
  totalStakedEth: number;
  currentApr: number;
  validatorCount: number;
  withdrawalQueueLength: number;
}

/** Parameters for querying Lido staking data. */
export interface LidoStakingQuery {
  chainId?: string;
  limit?: number;
  offset?: number;
}
