/**
 * Domain Event — MitigationIntent
 *
 * Pure domain type representing a decision to mitigate risk.
 * Emitted by the CRE pipeline when an agent or escalation signal
 * determines that action is needed.
 *
 * The infrastructure layer (CCC adapter) consumes this and
 * translates it into an on-chain transaction.
 *
 * No viem. No ethers. No RPC. No infrastructure references.
 */

export type MitigationType =
  | "ADD_COLLATERAL"
  | "REPAY_DEBT"
  | "PARTIAL_LIQUIDATION"
  | "EMERGENCY_EXIT";

export interface MitigationIntent {
  /** Unique ID for this mitigation intent. */
  id: string;
  /** The wallet/user this mitigation targets. */
  user: string;
  /** Chain where the position exists. */
  chainId: string;
  /** Protocol the position belongs to. */
  protocol: string;
  /** Type of mitigation to perform. */
  type: MitigationType;
  /** Asset to use for mitigation (e.g., WETH address). */
  asset: string;
  /** Amount in human-readable units (e.g., "0.5" ETH). */
  amount: string;
  /** Health factor before mitigation. */
  preHealthFactor: number;
  /** Target health factor after mitigation. */
  targetHealthFactor: number;
  /** Risk score that triggered this intent. */
  riskScore: number;
  /** ACE risk band that triggered this intent. */
  riskBand: string;
  /** Agent ID that initiated the escalation. */
  agentId: string;
  /** Unix ms when the intent was created. */
  timestamp: number;
}

/**
 * Execution report generated after a CCC adapter processes
 * a MitigationIntent. Used for observability and audit.
 */
export interface ExecutionReport {
  /** The mitigation intent that was executed. */
  intentId: string;
  /** Health factor before execution. */
  preHF: number;
  /** Health factor after execution. */
  postHF: number;
  /** Time from intent creation to decision (ms). */
  decisionLatencyMs: number;
  /** Time from decision to tx confirmation (ms). */
  executionLatencyMs: number;
  /** Total end-to-end latency (ms). */
  totalLatencyMs: number;
  /** Transaction hash (on fork or mainnet). */
  txHash: string;
  /** Fork ID if executing on a Tenderly fork. */
  forkId?: string;
  /** Whether execution succeeded. */
  success: boolean;
  /** Error message if failed. */
  error?: string;
  /** Unix ms when report was generated. */
  timestamp: number;
}
