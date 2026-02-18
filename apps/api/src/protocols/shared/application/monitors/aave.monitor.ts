/**
 * AaveMonitor — RiskMonitor Adapter for Aave
 *
 * Bounded context: Shared / Application / Monitors
 *
 * This is the SINGLE normalization boundary for Aave domain results.
 * No other file may import `runMonitor()` or map domain objects to
 * `MonitorSnapshot`.
 *
 * Mapping:
 *   runMonitor() → MonitorResult (domain-specific)
 *     ↓
 *   AaveMonitor.run() → MonitorSnapshot (normalized)
 *     globalRiskIndex     ← composite × 100 (0–100 scale)
 *     liquidationPressure ← "Liquidation Proximity" dimension × 100
 *     timestamp           ← monitoredAt (ISO string)
 *
 * Side-effects (fire-and-forget, non-blocking):
 *   If the domain emits a CrossChainRiskSignal (escalate/pause),
 *   the adapter dispatches it via CCIP infrastructure.  This keeps
 *   CCIP orchestration inside the adapter boundary — the CRE webhook
 *   and query service never see domain events.
 *
 * DDD role: Adapter (maps domain → shared, orchestrates infra side-effects).
 */

import { Protocol, type Chain } from "../../types/risk-api.types.js";
import type { MonitorSnapshot } from "../../types/monitor-snapshot.types.js";
import type { RiskMonitor } from "./risk-monitor.port.js";
import { runMonitor } from "../../../aave/risk-intelligence/monitor.js";
import { dispatchCrossChainRisk } from "../../../aave/ccip/sender.js";

/**
 * Derive liquidation pressure from the Aave risk dimensions.
 * Uses the "Liquidation Proximity" dimension (0..1) × 100 → 0..100.
 * Falls back to 0 if the dimension is absent.
 */
function deriveLiquidationPressure(
  dimensions: ReadonlyArray<{ label: string; value: number }>
): number {
  const lpDim = dimensions.find((d) => d.label === "Liquidation Proximity");
  if (!lpDim) return 0;
  return Math.round(lpDim.value * 1000) / 10; // 0..100 with 1 decimal
}

export class AaveMonitor implements RiskMonitor {
  async run(chain: Chain): Promise<MonitorSnapshot> {
    const result = await runMonitor(chain);

    // ── CCIP side-effect (fire-and-forget, non-blocking) ──────────
    // If the domain emitted a cross-chain signal, dispatch it here
    // so that no downstream consumer needs access to domain events.
    if (result.crossChainSignal) {
      dispatchCrossChainRisk(result.crossChainSignal);
    }

    return {
      protocol: Protocol.AAVE,
      chain,
      globalRiskIndex:
        Math.round(result.score.composite * 1000) / 10, // 0..100 with 1 decimal
      liquidationPressure: deriveLiquidationPressure(result.score.dimensions),
      timestamp: result.monitoredAt,
    };
  }
}
