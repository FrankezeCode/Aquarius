import type { AaveActiveChain } from "../../routes/v1/aave-risk/chain.js";

export type AgentEnrollmentMode =
  | "alert_only"
  | "mitigate_agent"
  | "buffer_vault";

export interface AgentEnrollmentChannels {
  telegram?: string;
  webhook?: string;
}

export interface AgentEnrollmentRecord {
  walletAddress: string;
  chain: AaveActiveChain;
  mode: AgentEnrollmentMode;
  channels: AgentEnrollmentChannels;
  displayName?: string;
  status: "active" | "inactive";
  policyBindingStatus: PolicyBindingStatus;
  policyBindingRef: string | null;
  bindingChainId: number | null;
  bindingError: string | null;
  lastBindingAttemptAt: number | null;
  lastBindingIdempotencyKey: string | null;
  deactivationTxRef: string | null;
  deactivatedAt: number | null;
  deactivationError: string | null;
  lastDeactivationAttemptAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export type PolicyBindingStatus =
  | "pending_onchain"
  | "signing_requested"
  | "pending_tx"
  | "bound_onchain"
  | "bind_failed";

export interface UpsertAgentEnrollmentInput {
  walletAddress: string;
  chain: AaveActiveChain;
  mode: AgentEnrollmentMode;
  channels: AgentEnrollmentChannels;
  displayName?: string;
}

export interface ValidateChannelsInput {
  telegram?: string;
  webhook?: string;
}

export interface ValidateChannelsResult {
  valid: boolean;
  errors: string[];
  normalized: AgentEnrollmentChannels;
}
