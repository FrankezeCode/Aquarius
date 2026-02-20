/**
 * CCC Infrastructure — Types
 *
 * Types for the Chainlink Confidential Compute execution layer.
 * These are infrastructure types, not domain types.
 *
 * Domain types (MitigationIntent, ExecutionReport) live in
 * domain/events/MitigationIntent.ts.
 */

export type ExecutionMode = "simulated_ccc" | "real_ccc";

export interface CccExecutionConfig {
  mode: ExecutionMode;
  rpcUrl: string;
  forkId?: string;
}
