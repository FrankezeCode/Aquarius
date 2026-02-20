/**
 * Scheduler — Anomaly Check
 *
 * Detects abnormal system behavior that may require
 * entering observe-only or recovery mode.
 *
 * Anomalies:
 *   - Oracle inactivity (no price updates for N blocks)
 *   - Execution failures exceeding threshold
 *   - WSS disconnect duration exceeding threshold
 *   - Position graph staleness
 *
 * Stateless functions. Called periodically by the circuit breaker.
 */

export interface AnomalyCheckInput {
  lastOracleUpdateTimestamp: number;
  lastBlockTimestamp: number;
  executionFailuresInWindow: number;
  executionAttemptsInWindow: number;
  wssDisconnectedSince: number | null;
  positionGraphLastUpdate: number;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  anomalies: AnomalyType[];
  severity: "none" | "warning" | "critical";
}

export type AnomalyType =
  | "oracle_inactivity"
  | "execution_failures"
  | "wss_disconnected"
  | "graph_stale";

const ORACLE_STALE_MS = 120_000; // 2 minutes without oracle update
const WSS_DISCONNECT_CRITICAL_MS = 60_000; // 1 minute disconnect
const EXECUTION_FAILURE_THRESHOLD = 0.5; // 50% failure rate
const GRAPH_STALE_MS = 180_000; // 3 minutes without graph update

export function checkAnomalies(input: AnomalyCheckInput): AnomalyResult {
  const now = Date.now();
  const anomalies: AnomalyType[] = [];
  let maxSeverity: AnomalyResult["severity"] = "none";

  // Oracle inactivity
  if (input.lastOracleUpdateTimestamp > 0) {
    const oracleAge = now - input.lastOracleUpdateTimestamp;
    if (oracleAge > ORACLE_STALE_MS) {
      anomalies.push("oracle_inactivity");
      maxSeverity = oracleAge > ORACLE_STALE_MS * 3 ? "critical" : "warning";
    }
  }

  // Execution failure rate
  if (input.executionAttemptsInWindow > 2) {
    const failureRate = input.executionFailuresInWindow / input.executionAttemptsInWindow;
    if (failureRate >= EXECUTION_FAILURE_THRESHOLD) {
      anomalies.push("execution_failures");
      maxSeverity = "critical";
    }
  }

  // WSS disconnected
  if (input.wssDisconnectedSince !== null) {
    const disconnectedFor = now - input.wssDisconnectedSince;
    if (disconnectedFor > WSS_DISCONNECT_CRITICAL_MS) {
      anomalies.push("wss_disconnected");
      maxSeverity = "critical";
    }
  }

  // Position graph staleness
  if (input.positionGraphLastUpdate > 0) {
    const graphAge = now - input.positionGraphLastUpdate;
    if (graphAge > GRAPH_STALE_MS) {
      anomalies.push("graph_stale");
      if (maxSeverity !== "critical") maxSeverity = "warning";
    }
  }

  return {
    isAnomaly: anomalies.length > 0,
    anomalies,
    severity: maxSeverity,
  };
}
