/**
 * Cross-chain vault gateway — domain types (advisory / routing only).
 * Execution remains on-chain; this layer does not move funds.
 */

export type VaultSleeve = "buffer_insurance" | "yield_seeker";

export type StrategyKind =
  | "lending_market"
  | "amm_liquidity"
  | "liquid_staking_token"
  | "native_validator_delegation"
  | "protocol_incentives";

export type IntegrationMaturity =
  | "advisory_schema_only"
  | "demo_simulation"
  | "production_integrated";

/** Honest posture for curated PoS / delegation execution vs advisory-only routing (Phase 7c). */
export type DelegationExecution =
  | "advisory"
  | "live_staged"
  | "unavailable";

export type RegisteredChain = {
  id: string;
  displayName: string;
  /** EVM chain id when applicable; null for non-EVM logical ids */
  evmChainId: number | null;
  maturity: IntegrationMaturity;
  /** EVM curated delegation rail: advisory until explicitly enabled per deployment. */
  delegationExecution: DelegationExecution;
};

export type RoutingRecommendation = {
  chain: string;
  asset: string;
  sleeves: Array<{
    sleeve: VaultSleeve;
    /** Ordered preference; not a guarantee of availability */
    strategyKinds: StrategyKind[];
    maturity: IntegrationMaturity;
    /** When `native_validator_delegation` is listed, reflects delegation execution honesty vs this deployment. */
    delegationExecution?: DelegationExecution;
    notes: string;
  }>;
  disclaimer: string;
};
