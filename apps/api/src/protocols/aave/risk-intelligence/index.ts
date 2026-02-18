/**
 * Risk-Intelligence — Barrel Export
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Re-exports every public symbol so CRE pipelines & internal API
 * consumers can import from a single entry-point:
 *
 *   import { runMonitor, scoreRisk, correlateSignals } from
 *     "../protocols/aave/risk-intelligence/index.js";
 */

// ── Signals ──────────────────────────────────────────────────────────
export {
  fetchPositionSnapshots,
  deriveChainMetrics,
  fetchChainMetrics,
  type AavePositionSnapshot,
  type AaveChainMetrics,
} from "./signals.js";

// ── Correlator ───────────────────────────────────────────────────────
export {
  correlateSignals,
  type SignalDimension,
  type CorrelatedRiskAssessment,
} from "./correlator.js";

// ── Scorer (ACE) ─────────────────────────────────────────────────────
export {
  scoreRisk,
  type AceRiskLevel,
  type RiskScore,
} from "./scorer.js";

// ── Monitor ──────────────────────────────────────────────────────────
export {
  runMonitor,
  runMonitorMultiChain,
  type MonitorAction,
  type MonitorResult,
} from "./monitor.js";

// ── Domain Events ────────────────────────────────────────────────────
export { type CrossChainRiskSignal } from "./domain-events.js";
