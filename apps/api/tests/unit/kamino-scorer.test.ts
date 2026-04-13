/**
 * Kamino intelligence — pure scorer tests (no RPC).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { KaminoRiskSnapshot } from "@aquarius/types";
import { scoreKaminoSnapshot } from "../../src/protocols/kamino-solana/risk-intelligence/scorer.js";

function baseSnapshot(
  overrides: Partial<KaminoRiskSnapshot> = {}
): KaminoRiskSnapshot {
  return {
    metadata: {
      protocol: "kamino",
      chainId: 0,
      timestamp: 1_700_000_000_000,
      solanaCluster: "mainnet-beta",
    },
    wallet: "11111111111111111111111111111112",
    marketPubkey: "So11111111111111111111111111111111111111112",
    loanToValuePct: 45,
    reserveLabels: ["SOL", "USDC"],
    riskScore: 45,
    severity: "low",
    ...overrides,
  };
}

describe("scoreKaminoSnapshot", () => {
  it("maps low LTV to info stage", () => {
    const r = scoreKaminoSnapshot(baseSnapshot({ loanToValuePct: 40, riskScore: 35 }));
    assert.equal(r.stage, "info");
    assert.ok(r.composite01 >= 0 && r.composite01 <= 1);
    assert.ok(r.events.length >= 1);
  });

  it("maps stressed LTV to invalidate stage", () => {
    const r = scoreKaminoSnapshot(
      baseSnapshot({
        loanToValuePct: 92,
        riskScore: 95,
        severity: "critical",
      })
    );
    assert.equal(r.stage, "invalidate");
  });
});
