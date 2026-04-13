/**
 * Risk / Kamino (Solana) — Bounded context
 *
 * Kamino-specific snapshot extending EvaluatableRisk.
 * @see docs/adr/0001-domains-and-boundaries.md
 */

import type { EvaluatableRisk, RiskMetadata } from "./base.js";

/** Kamino row metadata: non-EVM sentinel chainId + cluster. */
export type KaminoRiskMetadata = RiskMetadata & {
  readonly protocol: "kamino";
  readonly chainId: 0;
  readonly solanaCluster: "mainnet-beta" | "devnet" | "testnet";
};

/**
 * Normalized Kamino lending risk view (read path).
 * `loanToValuePct` is 0–100 for rule-based scoring.
 */
export interface KaminoRiskSnapshot extends Omit<EvaluatableRisk, "metadata"> {
  readonly metadata: KaminoRiskMetadata;
  /** Owner pubkey (base58). */
  readonly wallet: string;
  /** Lending market pubkey (base58). */
  readonly marketPubkey: string;
  readonly loanToValuePct: number;
  /** Human-readable tags for copilot (e.g. reserve symbols). */
  readonly reserveLabels: readonly string[];
}
