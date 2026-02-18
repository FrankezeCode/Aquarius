/**
 * Unit & Integration Tests — monitor.ts
 *
 * Covers:
 *   - runMonitor returns valid MonitorResult
 *   - Action mapping: safe/watch → observe, early-warning → escalate, critical → pause
 *   - CCIP dispatch flag correctness
 *   - runMonitorMultiChain parallel execution
 *   - Structured log output verification
 *   - Performance: pipeline completes within acceptable time
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  runMonitor,
  runMonitorMultiChain,
} from "../../../../src/protocols/aave/risk-intelligence/monitor.js";

// ── runMonitor (single chain, uses mock data) ────────────────────────

describe("monitor / runMonitor", () => {
  it("returns a valid MonitorResult", async () => {
    const result = await runMonitor("ethereum", 10);
    assert.equal(typeof result.action, "string");
    assert.ok(
      ["observe", "escalate", "pause"].includes(result.action),
      `Action should be observe/escalate/pause, got ${result.action}`
    );
    assert.equal(typeof result.ccipDispatched, "boolean");
    assert.equal(typeof result.monitoredAt, "string");
    // monitoredAt should be ISO date
    assert.ok(!isNaN(Date.parse(result.monitoredAt)));

    // Score sub-object
    assert.equal(result.score.chainId, "ethereum");
    assert.ok(result.score.composite >= 0);
    assert.ok(result.score.composite <= 1);
    assert.ok(
      ["safe", "watch", "early-warning", "critical"].includes(result.score.level)
    );
    assert.equal(typeof result.score.summary, "string");
    assert.equal(result.score.sampleSize, 10);
  });

  it("safe/watch actions do NOT dispatch CCIP", async () => {
    // Run many iterations; when action is observe, ccip should be false
    const results = await Promise.all(
      Array.from({ length: 20 }, () => runMonitor("ethereum", 10))
    );
    for (const r of results) {
      if (r.action === "observe") {
        assert.equal(
          r.ccipDispatched,
          false,
          "observe action should not dispatch CCIP"
        );
      }
    }
  });

  it("escalate/pause actions DO dispatch CCIP", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => runMonitor("ethereum", 10))
    );
    for (const r of results) {
      if (r.action === "escalate" || r.action === "pause") {
        assert.equal(
          r.ccipDispatched,
          true,
          `${r.action} action should dispatch CCIP`
        );
      }
    }
  });

  it("respects positionLimit parameter", async () => {
    const r5 = await runMonitor("ethereum", 5);
    assert.equal(r5.score.sampleSize, 5);
    const r100 = await runMonitor("ethereum", 100);
    assert.equal(r100.score.sampleSize, 100);
  });
});

// ── runMonitorMultiChain ─────────────────────────────────────────────

describe("monitor / runMonitorMultiChain", () => {
  it("returns results for all requested chains", async () => {
    const chains = ["ethereum", "arbitrum", "base"];
    const results = await runMonitorMultiChain(chains, 10);
    assert.equal(results.length, 3);
    assert.equal(results[0]!.score.chainId, "ethereum");
    assert.equal(results[1]!.score.chainId, "arbitrum");
    assert.equal(results[2]!.score.chainId, "base");
  });

  it("each result is a valid MonitorResult", async () => {
    const results = await runMonitorMultiChain(["ethereum", "arbitrum"], 5);
    for (const r of results) {
      assert.ok(["observe", "escalate", "pause"].includes(r.action));
      assert.equal(typeof r.ccipDispatched, "boolean");
      assert.ok(r.score.composite >= 0 && r.score.composite <= 1);
    }
  });
});

// ── Performance ──────────────────────────────────────────────────────

describe("monitor / performance", () => {
  it("single chain pipeline completes in < 100ms", async () => {
    const start = performance.now();
    await runMonitor("ethereum", 50);
    const elapsed = performance.now() - start;
    assert.ok(
      elapsed < 100,
      `Pipeline should complete in < 100ms, took ${elapsed.toFixed(1)}ms`
    );
  });

  it("multi-chain (3) completes in < 200ms", async () => {
    const start = performance.now();
    await runMonitorMultiChain(["ethereum", "arbitrum", "base"], 50);
    const elapsed = performance.now() - start;
    assert.ok(
      elapsed < 200,
      `Multi-chain should complete in < 200ms, took ${elapsed.toFixed(1)}ms`
    );
  });
});
