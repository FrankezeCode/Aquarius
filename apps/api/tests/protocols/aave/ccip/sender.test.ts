/**
 * Unit Tests — ccip/sender.ts
 *
 * Covers:
 *   - sendCcipRiskSignal returns correct shape (legacy async stub)
 *   - Mock messageId format
 *   - Payload echo
 *   - Multiple sequential calls produce unique messageIds
 *   - dispatchCrossChainRisk: non-blocking, fire-and-forget
 *   - dispatchCrossChainRisk: does not throw for any risk level
 *   - dispatchCrossChainRisk: returns void (not a Promise)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  sendCcipRiskSignal,
  dispatchCrossChainRisk,
  type CcipRiskPayload,
} from "../../../../src/protocols/aave/ccip/sender.js";

import type { CrossChainRiskSignal } from "../../../../src/protocols/aave/risk-intelligence/domain-events.js";

// ── Helpers ──────────────────────────────────────────────────────────

function makePayload(overrides?: Partial<CcipRiskPayload>): CcipRiskPayload {
  return {
    sourceChainId: "ethereum",
    riskLevel: "early-warning",
    composite: 0.62,
    action: "escalate",
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}

function makeSignal(
  overrides?: Partial<CrossChainRiskSignal>
): CrossChainRiskSignal {
  return {
    sourceChain: "ethereum",
    workflowId: "aave-risk-ethereum",
    riskLevel: "critical",
    composite: 0.85,
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}

// ── Tests: sendCcipRiskSignal (legacy async stub) ────────────────────

describe("ccip / sender — sendCcipRiskSignal", () => {
  it("returns stub-ok status", async () => {
    const result = await sendCcipRiskSignal(makePayload());
    assert.equal(result.status, "stub-ok");
  });

  it("returns a messageId containing source chain", async () => {
    const result = await sendCcipRiskSignal(makePayload());
    assert.ok(result.messageId.includes("ethereum"));
    assert.ok(result.messageId.startsWith("ccip-stub-"));
  });

  it("echoes the payload back", async () => {
    const payload = makePayload({ composite: 0.88, action: "pause" });
    const result = await sendCcipRiskSignal(payload);
    assert.deepEqual(result.payload, payload);
  });

  it("different timestamps produce different messageIds", async () => {
    const r1 = await sendCcipRiskSignal(makePayload({ timestamp: 1000 }));
    const r2 = await sendCcipRiskSignal(makePayload({ timestamp: 2000 }));
    assert.notEqual(r1.messageId, r2.messageId);
  });

  it("different chains produce different messageIds", async () => {
    const r1 = await sendCcipRiskSignal(
      makePayload({ sourceChainId: "ethereum" })
    );
    const r2 = await sendCcipRiskSignal(
      makePayload({ sourceChainId: "arbitrum" })
    );
    assert.notEqual(r1.messageId, r2.messageId);
  });

  it("handles all risk levels", async () => {
    for (const level of ["safe", "watch", "early-warning", "critical"]) {
      const result = await sendCcipRiskSignal(
        makePayload({ riskLevel: level })
      );
      assert.equal(result.status, "stub-ok");
      assert.equal(result.payload.riskLevel, level);
    }
  });
});

// ── Tests: dispatchCrossChainRisk (non-blocking) ─────────────────────

describe("ccip / sender — dispatchCrossChainRisk", () => {
  it("returns void (not a Promise)", () => {
    const result = dispatchCrossChainRisk(makeSignal());
    assert.equal(result, undefined, "dispatchCrossChainRisk must return void");
  });

  it("does not throw for critical risk level", () => {
    assert.doesNotThrow(() => {
      dispatchCrossChainRisk(makeSignal({ riskLevel: "critical" }));
    });
  });

  it("does not throw for early-warning risk level", () => {
    assert.doesNotThrow(() => {
      dispatchCrossChainRisk(makeSignal({ riskLevel: "early-warning" }));
    });
  });

  it("handles all risk levels without error", () => {
    for (const level of [
      "safe",
      "watch",
      "early-warning",
      "critical",
    ] as const) {
      assert.doesNotThrow(() => {
        dispatchCrossChainRisk(makeSignal({ riskLevel: level }));
      });
    }
  });

  it("does not block — completes in < 1ms", () => {
    const start = performance.now();
    dispatchCrossChainRisk(makeSignal());
    const elapsed = performance.now() - start;
    assert.ok(
      elapsed < 1,
      `dispatchCrossChainRisk should be non-blocking, took ${elapsed.toFixed(3)}ms`
    );
  });

  it("handles multiple rapid dispatches", () => {
    assert.doesNotThrow(() => {
      for (let i = 0; i < 100; i++) {
        dispatchCrossChainRisk(makeSignal({ timestamp: Date.now() + i }));
      }
    });
  });
});
