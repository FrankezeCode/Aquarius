/**
 * Shared — Monitor Snapshot Types
 *
 * Bounded context: Shared / Types
 *
 * The normalized, protocol-agnostic snapshot that the in-memory cache
 * always stores.  Every protocol monitor maps its domain-specific
 * result into this shape before returning.
 *
 * This is the **single source of truth** for what the API routes read.
 * No domain entities, no Date objects — serialisation-safe.
 *
 * DDD role: Shared Kernel (Value Object / DTO).
 */

import type { Protocol, Chain } from "./risk-api.types.js";

// ── MonitorSnapshot ──────────────────────────────────────────────────

export interface MonitorSnapshot {
  /** Which protocol produced this snapshot. */
  readonly protocol: Protocol;
  /** Which chain was monitored. */
  readonly chain: Chain;
  /** Composite risk index on a 0–100 scale. */
  readonly globalRiskIndex: number;
  /** Liquidation pressure metric (derived from risk dimensions). */
  readonly liquidationPressure: number;
  /** ISO-8601 timestamp of when the pipeline last ran. */
  readonly timestamp: string;
}

// ── Factory ──────────────────────────────────────────────────────────

/**
 * Build a "system-not-ready" stub snapshot for protocols that have
 * not yet run their pipeline.
 */
export function stubSnapshot(
  protocol: Protocol,
  chain: Chain
): MonitorSnapshot {
  return {
    protocol,
    chain,
    globalRiskIndex: 0,
    liquidationPressure: 0,
    timestamp: "system-not-ready",
  };
}
