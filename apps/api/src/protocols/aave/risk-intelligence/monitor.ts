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
import { scoreRisk, type RiskScore, type AceRiskLevel } from "./scorer.js";
import type { CrossChainRiskSignal } from "./domain-events.js";

// ── Types ────────────────────────────────────────────────────────────

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

// ── Action mapping ───────────────────────────────────────────────────

const ACTION_MAP: Record<AceRiskLevel, MonitorAction> = {
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
 * Pipeline:
 *   1. Fetch position snapshots (signals)
 *   2. Derive aggregate chain metrics
 *   3. Correlate signals into composite assessment
 *   4. Score using ACE classification
 *   5. Determine action (observe / escalate / pause)
 *   6. If escalate or pause → dispatch CCIP stub
 */
export async function runMonitor(
  chainId: string,
  positionLimit = 50
): Promise<MonitorResult> {
  // 1. Fetch signals
  const positions = await fetchPositionSnapshots(chainId, positionLimit);

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
  let crossChainSignal: CrossChainRiskSignal | undefined;
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

  const result: MonitorResult = {
    score,
    action,
    ccipDispatched,
    monitoredAt: new Date().toISOString(),
    crossChainSignal,
  };

  // Structured log for observability
  console.info(
    `[risk-monitor] chain=${chainId} level=${score.level} composite=${score.composite} action=${action} ccip=${ccipDispatched}`
  );

  return result;
}

/**
 * Convenience: run monitor for multiple chains in parallel.
 */
export async function runMonitorMultiChain(
  chainIds: string[],
  positionLimit = 50
): Promise<MonitorResult[]> {
  return Promise.all(chainIds.map((id) => runMonitor(id, positionLimit)));
}
