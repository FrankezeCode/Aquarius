/**
 * Unit Tests — ccip/receiver.ts + global-risk-state.ts
 *
 * Covers:
 *   - receiveCcipRiskSignal returns correct shape (legacy stub)
 *   - Message echoes correct messageId and payload
 *   - Source chain extraction
 *   - receivedAt timestamp is populated
 *   - handleIncomingCrossChainRisk: processes domain events
 *   - handleIncomingCrossChainRisk: toggles observe-only on critical
 *   - global-risk-state: mode transitions
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  receiveCcipRiskSignal,
  handleIncomingCrossChainRisk,
} from "../../../../src/protocols/aave/ccip/receiver.js";

import type { CcipRiskPayload } from "../../../../src/protocols/aave/ccip/sender.js";

import type { CrossChainRiskSignal } from "../../../../src/protocols/aave/risk-intelligence/domain-events.js";

import {
  getSystemMode,
  restoreNormalMode,
} from "../../../../src/protocols/aave/ccip/global-risk-state.js";

// ── Helpers ──────────────────────────────────────────────────────────

function makePayload(overrides?: Partial<CcipRiskPayload>): CcipRiskPayload {
  return {
    sourceChainId: "arbitrum",
    riskLevel: "critical",
    composite: 0.85,
    action: "pause",
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}

function makeSignal(
  overrides?: Partial<CrossChainRiskSignal>
): CrossChainRiskSignal {
  return {
    sourceChain: "arbitrum",
    workflowId: "aave-risk-arbitrum",
    riskLevel: "critical",
    composite: 0.85,
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}

// ── Tests: receiveCcipRiskSignal (legacy stub) ───────────────────────

describe("ccip / receiver — receiveCcipRiskSignal", () => {
  it("returns stub-received status", async () => {
    const result = await receiveCcipRiskSignal("msg-001", makePayload());
    assert.equal(result.status, "stub-received");
  });

  it("echoes the messageId", async () => {
    const result = await receiveCcipRiskSignal("msg-xyz", makePayload());
    assert.equal(result.message.messageId, "msg-xyz");
  });

  it("echoes the payload", async () => {
    const payload = makePayload({ composite: 0.92 });
    const result = await receiveCcipRiskSignal("msg-002", payload);
    assert.deepEqual(result.message.payload, payload);
  });

  it("extracts sourceChainId from payload", async () => {
    const result = await receiveCcipRiskSignal(
      "msg-003",
      makePayload({ sourceChainId: "ethereum" })
    );
    assert.equal(result.message.sourceChainId, "ethereum");
  });

  it("populates receivedAt as a valid timestamp", async () => {
    const before = Date.now();
    const result = await receiveCcipRiskSignal("msg-004", makePayload());
    const after = Date.now();
    assert.ok(result.message.receivedAt >= before);
    assert.ok(result.message.receivedAt <= after);
  });

  it("handles various risk levels", async () => {
    for (const level of ["safe", "watch", "early-warning", "critical"]) {
      const result = await receiveCcipRiskSignal(
        `msg-${level}`,
        makePayload({ riskLevel: level })
      );
      assert.equal(result.status, "stub-received");
      assert.equal(result.message.payload.riskLevel, level);
    }
  });

  it("handles different source chains", async () => {
    for (const chain of ["ethereum", "arbitrum", "base", "solana"]) {
      const result = await receiveCcipRiskSignal(
        `msg-${chain}`,
        makePayload({ sourceChainId: chain })
      );
      assert.equal(result.message.sourceChainId, chain);
    }
  });
});

// ── Tests: handleIncomingCrossChainRisk ──────────────────────────────

describe("ccip / receiver — handleIncomingCrossChainRisk", () => {
  beforeEach(() => {
    restoreNormalMode();
  });

  it("does not throw for any risk level", () => {
    for (const level of [
      "safe",
      "watch",
      "early-warning",
      "critical",
    ] as const) {
      assert.doesNotThrow(() => {
        handleIncomingCrossChainRisk(makeSignal({ riskLevel: level }));
      });
    }
  });

  it("activates observe-only mode on critical signal", () => {
    assert.equal(getSystemMode(), "normal");
    handleIncomingCrossChainRisk(makeSignal({ riskLevel: "critical" }));
    assert.equal(getSystemMode(), "observe-only");
  });

  it("does NOT activate observe-only for non-critical signals", () => {
    for (const level of ["safe", "watch", "early-warning"] as const) {
      restoreNormalMode();
      handleIncomingCrossChainRisk(makeSignal({ riskLevel: level }));
      assert.equal(
        getSystemMode(),
        "normal",
        `Mode should remain normal for ${level}`
      );
    }
  });
});

// ── Tests: global-risk-state ─────────────────────────────────────────

describe("ccip / global-risk-state", () => {
  beforeEach(() => {
    restoreNormalMode();
  });

  it("starts in normal mode", () => {
    assert.equal(getSystemMode(), "normal");
  });

  it("restoreNormalMode resets from observe-only", () => {
    handleIncomingCrossChainRisk(makeSignal({ riskLevel: "critical" }));
    assert.equal(getSystemMode(), "observe-only");
    restoreNormalMode();
    assert.equal(getSystemMode(), "normal");
  });

  it("getSystemMode is synchronous and zero-cost", () => {
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      getSystemMode();
    }
    const elapsed = performance.now() - start;
    assert.ok(
      elapsed < 10,
      `10k reads should take < 10ms, took ${elapsed.toFixed(2)}ms`
    );
  });
});
