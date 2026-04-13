/**
 * Kamino / Solana — rule-based risk intelligence (CRE-compatible stage + events).
 */

import type {
  AquariusDomainId,
  CreEscalationStage,
  KaminoRiskSnapshot,
} from "@aquarius/types";

export const KAMINO_SOLANA_DOMAIN = "kamino-solana" as const;

export type CreStyleEventSeverity = "info" | "warning" | "critical";

export interface KaminoCreStyleEvent {
  readonly id: string;
  /** ISO timestamp */
  readonly timestamp: string;
  readonly message: string;
  readonly severity: CreStyleEventSeverity;
}

/** Version string for observability (bump when scoring rules change materially). */
export const KAMINO_INTELLIGENCE_VERSION = "1" as const;

export interface KaminoIntelligenceV1 {
  readonly domain: "kamino-solana";
  /** CRE escalation stage (compatible with riskProgression.stage). */
  readonly stage: CreEscalationStage;
  /** 0–1 composite (aligns with CRE riskScore.composite scale). */
  readonly composite01: number;
  readonly headline: string;
  readonly summary: string;
  readonly events: readonly KaminoCreStyleEvent[];
}

function mapSeverityToEventSeverity(
  s: KaminoRiskSnapshot["severity"]
): CreStyleEventSeverity {
  if (s === "critical" || s === "high") return "critical";
  if (s === "medium") return "warning";
  return "info";
}

function mapToStage(snapshot: KaminoRiskSnapshot): CreEscalationStage {
  const ltv = snapshot.loanToValuePct;
  if (snapshot.severity === "critical" || ltv >= 88) return "invalidate";
  if (snapshot.severity === "high" || snapshot.severity === "medium" || ltv >= 72) {
    return "confirm";
  }
  return "info";
}

function buildEvents(
  snapshot: KaminoRiskSnapshot,
  stage: CreEscalationStage
): KaminoCreStyleEvent[] {
  const ts = new Date(snapshot.metadata.timestamp).toISOString();
  const sev = mapSeverityToEventSeverity(snapshot.severity);
  const events: KaminoCreStyleEvent[] = [
    {
      id: `kamino-ltv-${snapshot.metadata.timestamp}`,
      timestamp: ts,
      message: `Kamino obligation LTV (UI) is ${snapshot.loanToValuePct.toFixed(2)}% across reserves: ${snapshot.reserveLabels.length > 0 ? snapshot.reserveLabels.join(", ") : "—"}.`,
      severity: sev,
    },
    {
      id: `kamino-stage-${snapshot.metadata.timestamp}`,
      timestamp: ts,
      message: `Escalation stage ${stage.toUpperCase()} derived from Kamino lending snapshot (non-EVM).`,
      severity: stage === "invalidate" ? "critical" : stage === "confirm" ? "warning" : "info",
    },
  ];
  return events;
}

/** Rule-based scorer over normalized Kamino snapshot only (no Aave coupling). */
export function scoreKaminoSnapshot(snapshot: KaminoRiskSnapshot): KaminoIntelligenceV1 {
  const composite01 = Math.max(0, Math.min(1, snapshot.riskScore / 100));
  const stage = mapToStage(snapshot);
  const headline =
    snapshot.severity === "critical"
      ? "Liquidation risk elevated — review Kamino obligation collateralization."
      : snapshot.severity === "high"
        ? "Borrow utilization is high relative to liquidation threshold."
        : snapshot.severity === "medium"
          ? "Obligation is within normal Kamino lending parameters; monitor LTV."
          : "Obligation appears resilient on Kamino lending markets.";

  const summary = `Kamino LTV ${snapshot.loanToValuePct.toFixed(1)}% · severity ${snapshot.severity} · stage ${stage}.`;

  return {
    domain: KAMINO_SOLANA_DOMAIN,
    stage,
    composite01,
    headline,
    summary,
    events: buildEvents(snapshot, stage),
  };
}

/** @deprecated Phase A stub; prefer scoreKaminoSnapshot with a real snapshot. */
export function scoreKaminoStub(): {
  domain: AquariusDomainId;
  score: number;
  label: string;
} {
  return {
    domain: KAMINO_SOLANA_DOMAIN,
    score: 0,
    label: "stub",
  };
}
