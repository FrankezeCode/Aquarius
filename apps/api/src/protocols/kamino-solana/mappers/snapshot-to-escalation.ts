/**
 * Maps Kamino intelligence outputs → CRE-style escalation envelope + mitigation intent.
 */

import { randomUUID } from "node:crypto";
import type { KaminoRiskSnapshot } from "@aquarius/types";
import type {
  KaminoMitigationIntent,
  KaminoMitigationSuggestedAction,
} from "../../../domain/events/KaminoMitigationIntent.js";
import type { CreEscalationStage } from "@aquarius/types";
import type { KaminoIntelligenceV1 } from "../risk-intelligence/scorer.js";

/** Escalation payload for CRE / webhook responses (no raw SDK structs). */
export interface KaminoEscalationEvent {
  readonly domain: "kamino-solana";
  readonly stage: CreEscalationStage;
  readonly headline: string;
  readonly summary: string;
  readonly composite01: number;
  readonly wallet: string;
  readonly marketPubkey: string;
  readonly cluster: KaminoMitigationIntent["cluster"];
}

export function suggestedActionForStage(
  stage: CreEscalationStage
): KaminoMitigationSuggestedAction {
  if (stage === "info") return "OBSERVE";
  if (stage === "confirm") return "REPAY";
  return "ADD_COLLATERAL";
}

export function mapToKaminoEscalationEvent(
  snapshot: KaminoRiskSnapshot,
  intelligence: KaminoIntelligenceV1
): KaminoEscalationEvent {
  const cluster = snapshot.metadata.solanaCluster ?? "mainnet-beta";
  return {
    domain: "kamino-solana",
    stage: intelligence.stage,
    headline: intelligence.headline,
    summary: intelligence.summary,
    composite01: intelligence.composite01,
    wallet: snapshot.wallet,
    marketPubkey: snapshot.marketPubkey,
    cluster,
  };
}

export function buildKaminoMitigationIntent(input: {
  snapshot: KaminoRiskSnapshot;
  intelligence: KaminoIntelligenceV1;
  agentId: string;
  correlationId?: string;
  intentId?: string;
}): KaminoMitigationIntent {
  const { snapshot, intelligence, agentId, correlationId, intentId } = input;
  const cluster = snapshot.metadata.solanaCluster ?? "mainnet-beta";
  return {
    id: intentId ?? `kamino-intent-${randomUUID()}`,
    wallet: snapshot.wallet,
    marketPubkey: snapshot.marketPubkey,
    cluster,
    stage: intelligence.stage,
    suggestedAction: suggestedActionForStage(intelligence.stage),
    composite01: intelligence.composite01,
    riskScore: snapshot.riskScore,
    agentId,
    timestamp: Date.now(),
    correlationId,
  };
}

export function mapSnapshotToEscalationAndIntent(input: {
  snapshot: KaminoRiskSnapshot;
  intelligence: KaminoIntelligenceV1;
  agentId: string;
  correlationId?: string;
}): { escalation: KaminoEscalationEvent; intent: KaminoMitigationIntent } {
  const escalation = mapToKaminoEscalationEvent(
    input.snapshot,
    input.intelligence
  );
  const intent = buildKaminoMitigationIntent({
    snapshot: input.snapshot,
    intelligence: input.intelligence,
    agentId: input.agentId,
    correlationId: input.correlationId,
  });
  return { escalation, intent };
}
