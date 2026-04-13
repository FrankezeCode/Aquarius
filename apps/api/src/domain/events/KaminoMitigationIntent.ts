/**
 * Domain — Kamino mitigation intent (Solana / non-EVM).
 *
 * Advisory labels only in Phase C; no on-chain execution in this type.
 * Do not conflate with EVM MitigationIntent (health factor, asset hex addresses).
 */

import type { CreEscalationStage } from "@aquarius/types";

/** High-level mitigation suggestion derived from escalation stage (not a tx plan). */
export type KaminoMitigationSuggestedAction =
  | "OBSERVE"
  | "REPAY"
  | "ADD_COLLATERAL";

export interface KaminoMitigationIntent {
  readonly id: string;
  readonly wallet: string;
  readonly marketPubkey: string;
  readonly cluster: "mainnet-beta" | "devnet" | "testnet";
  readonly stage: CreEscalationStage;
  readonly suggestedAction: KaminoMitigationSuggestedAction;
  /** 0–1 composite aligned with Kamino intelligence. */
  readonly composite01: number;
  readonly riskScore: number;
  readonly agentId: string;
  readonly timestamp: number;
  readonly correlationId?: string;
}
