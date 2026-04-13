/**
 * Selva Runtime — Contract Types
 *
 * The runtime's own view of the risk contract.  This mirrors
 * @aquarius/types/risk/base exactly — it is the SDK-side boundary
 * definition of the same interface.
 *
 * The runtime ONLY depends on these types.
 * It NEVER imports protocol-specific risk snapshots.
 *
 * Why not import from @aquarius/types directly?
 *   The SDK must compile standalone without requiring workspace
 *   symlinks to be installed.  The shapes are identical by
 *   contract — TypeScript structural typing ensures compatibility.
 */

// ── Protocol Enum ────────────────────────────────────────────────────

export type ProtocolId = "aave" | "lido" | "uniswap" | "kamino";

// ── Core Value Objects ───────────────────────────────────────────────

export interface RiskMetadata {
  readonly protocol: ProtocolId;
  readonly chainId: number;
  readonly timestamp: number;
  readonly solanaCluster?: "mainnet-beta" | "devnet" | "testnet";
}

export type RiskSeverity = "low" | "medium" | "high" | "critical";

/**
 * The universal risk contract that the Selva Runtime evaluates.
 *
 * Every protocol adapter must normalize its raw data into this
 * shape before the runtime can evaluate it.
 */
export interface EvaluatableRisk {
  readonly metadata: RiskMetadata;
  /** Composite risk score 0–100. */
  readonly riskScore: number;
  /** Severity bucket. */
  readonly severity: RiskSeverity;
}
