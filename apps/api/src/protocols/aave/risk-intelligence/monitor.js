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
import { fetchPositionSnapshots, deriveChainMetrics } from "./signals.js";
import { correlateSignals } from "./correlator.js";
import { scoreRisk } from "./scorer.js";
// ── Action mapping ───────────────────────────────────────────────────
const ACTION_MAP = {
    safe: "observe",
    watch: "observe",
    "early-warning": "escalate",
    critical: "pause",
};
// ── Public API ───────────────────────────────────────────────────────
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
export async function runMonitor(chainId, positionsOrLimit = 50) {
    // 1. Resolve positions: injected array or legacy fetch
    const positions = Array.isArray(positionsOrLimit)
        ? positionsOrLimit
        : await fetchPositionSnapshots(chainId, positionsOrLimit);
    // 2. Aggregate
    const metrics = deriveChainMetrics(chainId, positions);
    // 3. Correlate
    const assessment = correlateSignals(chainId, positions, metrics);
    // 4. Score
    const score = scoreRisk(assessment);
    // --- TEMPORARY HIGH-RISK OVERRIDE FOR LOCAL TESTING ---
    if (process.env.TEST_HIGH_RISK === "1") {
        score.level = "critical";
        score.composite = 0.85;
        console.info("[risk-monitor] ⚠️ TEMP OVERRIDE: forcing HIGH-RISK for testing");
    }
    // 5. Action
    const action = ACTION_MAP[score.level];
    // 6. Emit domain event for cross-chain propagation (escalate | pause)
    //    The application layer decides whether & how to dispatch via CCIP.
    let crossChainSignal;
    const ccipDispatched = action === "escalate" || action === "pause";
    if (ccipDispatched) {
        crossChainSignal = {
            sourceChain: chainId,
            workflowId: `aave-risk-${chainId}`,
            riskLevel: score.level,
            composite: score.composite,
            timestamp: Date.now(),
        };
    }
    const result = {
        score,
        action,
        ccipDispatched,
        monitoredAt: new Date().toISOString(),
        crossChainSignal,
    };
    // Structured log for observability
    console.info(`[risk-monitor] chain=${chainId} level=${score.level} composite=${score.composite} action=${action} ccip=${ccipDispatched}`);
    return result;
}
/**
 * Convenience: run monitor for multiple chains in parallel.
 */
export async function runMonitorMultiChain(chainIds, positionLimit = 50) {
    return Promise.all(chainIds.map((id) => runMonitor(id, positionLimit)));
}
