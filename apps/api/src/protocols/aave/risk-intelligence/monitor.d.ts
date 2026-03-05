/**
 * Risk-Intelligence — Monitor
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Observes a RiskScore and decides on the appropriate action:
 *   - observe  → log only, no action
 *   - escalate → emit cross-chain domain event + log
 *   - pause    → flag for circuit-breaker (future: on-chain pause)
 *
 * Orchestrates the full pipeline: signals → correlate → score → act.
 *
 * DDD: This module is PURE DOMAIN. It never imports infrastructure
 * (no CCIP, no HTTP, no blockchain SDKs). Cross-chain dispatch is
 * handled by the application layer which reads the emitted domain event.
 */
import { type AavePositionSnapshot } from "./signals.js";
import { type RiskScore } from "./scorer.js";
import type { CrossChainRiskSignal } from "./domain-events.js";
export type MonitorAction = "observe" | "escalate" | "pause";
export interface MonitorResult {
    score: RiskScore;
    action: MonitorAction;
    ccipDispatched: boolean;
    /** ISO timestamp of when monitoring completed. */
    monitoredAt: string;
    /**
     * Domain event: populated when the monitor determines this risk
     * should be propagated cross-chain. The application layer is
     * responsible for dispatching this via infrastructure (CCIP).
     */
    crossChainSignal?: CrossChainRiskSignal;
}
/**
 * Run the full risk-intelligence pipeline for a single chain and return
 * the monitoring result.
 *
 * Accepts either:
 *   - A pre-fetched positions array (from IMarketDataProvider)
 *   - A numeric limit (legacy: fetches internally via mockPositions)
 *
 * When positions are injected, the monitor is pure domain with no I/O.
 *
 * Pipeline:
 *   1. Use provided positions (or fetch if limit given)
 *   2. Derive aggregate chain metrics
 *   3. Correlate signals into composite assessment
 *   4. Score using ACE classification
 *   5. Determine action (observe / escalate / pause)
 *   6. If escalate or pause → emit cross-chain domain event
 */
export declare function runMonitor(chainId: string, positionsOrLimit?: AavePositionSnapshot[] | number): Promise<MonitorResult>;
/**
 * Convenience: run monitor for multiple chains in parallel.
 */
export declare function runMonitorMultiChain(chainIds: string[], positionLimit?: number): Promise<MonitorResult[]>;
//# sourceMappingURL=monitor.d.ts.map