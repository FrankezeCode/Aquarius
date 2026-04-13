/**
 * Kamino snapshot → escalation + intent mapper (pure).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { KaminoRiskSnapshot } from "@aquarius/types";
import type { KaminoIntelligenceV1 } from "../../src/protocols/kamino-solana/risk-intelligence/scorer.js";
import {
  mapSnapshotToEscalationAndIntent,
  suggestedActionForStage,
} from "../../src/protocols/kamino-solana/mappers/snapshot-to-escalation.js";

function snap(over: Partial<KaminoRiskSnapshot> = {}): KaminoRiskSnapshot {
  return {
    metadata: {
      protocol: "kamino",
      chainId: 0,
      timestamp: 1_700_000_000_000,
      solanaCluster: "devnet",
    },
    wallet: "11111111111111111111111111111112",
    marketPubkey: "So11111111111111111111111111111111111111112",
    loanToValuePct: 50,
    reserveLabels: ["SOL"],
    riskScore: 50,
    severity: "low",
    ...over,
  };
}

function intel(over: Partial<KaminoIntelligenceV1> = {}): KaminoIntelligenceV1 {
  return {
    domain: "kamino-solana",
    stage: "info",
    composite01: 0.5,
    headline: "h",
    summary: "s",
    events: [],
    ...over,
  };
}

describe("snapshot-to-escalation", () => {
  it("maps snapshot + intelligence to escalation and intent", () => {
    const { escalation, intent } = mapSnapshotToEscalationAndIntent({
      snapshot: snap(),
      intelligence: intel({ stage: "confirm", composite01: 0.72 }),
      agentId: "agent-1",
      correlationId: "corr-1",
    });
    assert.equal(escalation.domain, "kamino-solana");
    assert.equal(escalation.stage, "confirm");
    assert.equal(intent.suggestedAction, suggestedActionForStage("confirm"));
    assert.equal(intent.agentId, "agent-1");
    assert.equal(intent.correlationId, "corr-1");
    assert.equal(intent.cluster, "devnet");
  });

  it("suggestedActionForStage maps invalidate to ADD_COLLATERAL", () => {
    assert.equal(suggestedActionForStage("invalidate"), "ADD_COLLATERAL");
  });
});
