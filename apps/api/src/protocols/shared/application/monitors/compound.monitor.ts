/**
 * CompoundMonitor — RiskMonitor Placeholder for Compound
 *
 * Bounded context: Shared / Application / Monitors
 *
 * Structural placeholder to preserve multi-protocol architecture
 * correctness.  Returns a stub MonitorSnapshot until a real Compound
 * risk pipeline is implemented.
 *
 * DDD role: Stub Adapter.
 */

import { Protocol, type Chain } from "../../types/risk-api.types.js";
import { stubSnapshot } from "../../types/monitor-snapshot.types.js";
import type { MonitorSnapshot } from "../../types/monitor-snapshot.types.js";
import type { RiskMonitor } from "./risk-monitor.port.js";

export class CompoundMonitor implements RiskMonitor {
  async run(chain: Chain): Promise<MonitorSnapshot> {
    // TODO: Implement real Compound risk pipeline
    return stubSnapshot(Protocol.COMPOUND, chain);
  }
}
