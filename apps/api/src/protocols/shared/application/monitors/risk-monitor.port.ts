/**
 * RiskMonitor Port — Application Layer Interface
 *
 * Bounded context: Shared / Application
 *
 * Defines the contract that every protocol-specific risk monitor must
 * implement.  The RiskQueryService depends on this port — never on
 * a concrete monitor.
 *
 * Each monitor maps its domain-specific result into a normalized
 * MonitorSnapshot before returning.  The cache always stores
 * MonitorSnapshot — never raw domain types.
 *
 * DDD role: Port (Hexagonal Architecture — driven side).
 */

import type { Chain } from "../../types/risk-api.types.js";
import type { MonitorSnapshot } from "../../types/monitor-snapshot.types.js";

// Re-export MonitorSnapshot so consumers can import from here too.
export type { MonitorSnapshot };

// ── Port Interface ───────────────────────────────────────────────────

/**
 * A protocol risk monitor capable of running a full pipeline for a
 * given chain and returning a **normalized** MonitorSnapshot.
 *
 * Implementations live inside each protocol's bounded context and
 * are registered in the monitor registry at startup.
 */
export interface RiskMonitor {
  /** Execute the full risk pipeline for the given chain. */
  run(chain: Chain): Promise<MonitorSnapshot>;
}
