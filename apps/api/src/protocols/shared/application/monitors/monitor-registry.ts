/**
 * Monitor Registry — Protocol → RiskMonitor Mapping
 *
 * Bounded context: Shared / Application / Monitors
 *
 * Single source of truth for which monitor runs for each protocol.
 * New protocols are added here — not in the query service, not in routes.
 *
 * DDD role: Application-layer configuration / composition root.
 */

import { Protocol } from "../../types/risk-api.types.js";
import type { RiskMonitor } from "./risk-monitor.port.js";
import { AaveMonitor } from "./aave.monitor.js";
import { CompoundMonitor } from "./compound.monitor.js";
import { MorphoMonitor } from "./morpho.monitor.js";

// ── Registry ─────────────────────────────────────────────────────────

const registry = new Map<Protocol, RiskMonitor>();

// Register all known protocol monitors.
// Only Aave returns real data; Compound + Morpho return stubs.
registry.set(Protocol.AAVE, new AaveMonitor());
registry.set(Protocol.COMPOUND, new CompoundMonitor());
registry.set(Protocol.MORPHO, new MorphoMonitor());

// ── Public API ───────────────────────────────────────────────────────

/**
 * Resolve the risk monitor for a given protocol.
 * Returns `undefined` if the protocol has no registered monitor.
 */
export function getMonitor(protocol: Protocol): RiskMonitor | undefined {
  return registry.get(protocol);
}

/**
 * Register (or replace) a risk monitor for a protocol.
 * Useful for testing or late-binding new protocols.
 */
export function registerMonitor(
  protocol: Protocol,
  monitor: RiskMonitor
): void {
  registry.set(protocol, monitor);
}

/**
 * List all currently registered protocols.
 */
export function registeredProtocols(): Protocol[] {
  return [...registry.keys()];
}
