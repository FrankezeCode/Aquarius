/**
 * MorphoMonitor — RiskMonitor Placeholder for Morpho
 *
 * Bounded context: Shared / Application / Monitors
 *
 * Structural placeholder to preserve multi-protocol architecture
 * correctness.  Returns a stub MonitorSnapshot until a real Morpho
 * risk pipeline is implemented.
 *
 * DDD role: Stub Adapter.
 */

import { Protocol, type Chain } from "../../types/risk-api.types.js";
import { stubSnapshot } from "../../types/monitor-snapshot.types.js";
import type { MonitorSnapshot } from "../../types/monitor-snapshot.types.js";
import type { RiskMonitor } from "./risk-monitor.port.js";

export class MorphoMonitor implements RiskMonitor {
  async run(chain: Chain): Promise<MonitorSnapshot> {
    // TODO: Implement real Morpho risk pipeline
    return stubSnapshot(Protocol.MORPHO, chain);
  }
}
