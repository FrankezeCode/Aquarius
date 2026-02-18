/**
 * Performance Benchmark — Risk Intelligence Pipeline
 *
 * Measures execution time at each stage of the pipeline:
 *   signals → correlator → scorer → monitor
 *
 * Also measures end-to-end for single-chain and multi-chain scenarios.
 * Results are printed as a structured summary table.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  fetchPositionSnapshots,
  deriveChainMetrics,
} from "../../../src/protocols/aave/risk-intelligence/signals.js";
import { correlateSignals } from "../../../src/protocols/aave/risk-intelligence/correlator.js";
import { scoreRisk } from "../../../src/protocols/aave/risk-intelligence/scorer.js";
import {
  runMonitor,
  runMonitorMultiChain,
} from "../../../src/protocols/aave/risk-intelligence/monitor.js";

// ── Helpers ──────────────────────────────────────────────────────────

interface BenchResult {
  label: string;
  durationMs: number;
}

const benchResults: BenchResult[] = [];

function record(label: string, durationMs: number) {
  benchResults.push({ label, durationMs: Math.round(durationMs * 100) / 100 });
}

// ── Stage-by-stage benchmarks ────────────────────────────────────────

describe("pipeline benchmark / stage timings", () => {
  it("signals: fetchPositionSnapshots (50 positions)", async () => {
    const start = performance.now();
    const positions = await fetchPositionSnapshots("ethereum", 50);
    const elapsed = performance.now() - start;
    record("fetchPositionSnapshots(50)", elapsed);
    assert.equal(positions.length, 50);
    assert.ok(elapsed < 50, `Should be < 50ms, took ${elapsed.toFixed(1)}ms`);
  });

  it("signals: deriveChainMetrics (50 positions)", async () => {
    const positions = await fetchPositionSnapshots("ethereum", 50);
    const start = performance.now();
    const metrics = deriveChainMetrics("ethereum", positions);
    const elapsed = performance.now() - start;
    record("deriveChainMetrics(50)", elapsed);
    assert.ok(metrics.totalPositions === 50);
    assert.ok(elapsed < 10, `Should be < 10ms, took ${elapsed.toFixed(1)}ms`);
  });

  it("correlator: correlateSignals (50 positions)", async () => {
    const positions = await fetchPositionSnapshots("ethereum", 50);
    const metrics = deriveChainMetrics("ethereum", positions);
    const start = performance.now();
    const assessment = correlateSignals("ethereum", positions, metrics);
    const elapsed = performance.now() - start;
    record("correlateSignals(50)", elapsed);
    assert.ok(assessment.compositeScore >= 0);
    assert.ok(elapsed < 10, `Should be < 10ms, took ${elapsed.toFixed(1)}ms`);
  });

  it("scorer: scoreRisk", async () => {
    const positions = await fetchPositionSnapshots("ethereum", 50);
    const metrics = deriveChainMetrics("ethereum", positions);
    const assessment = correlateSignals("ethereum", positions, metrics);
    const start = performance.now();
    const score = scoreRisk(assessment);
    const elapsed = performance.now() - start;
    record("scoreRisk", elapsed);
    assert.ok(score.level);
    assert.ok(elapsed < 5, `Should be < 5ms, took ${elapsed.toFixed(1)}ms`);
  });
});

// ── End-to-end benchmarks ────────────────────────────────────────────

describe("pipeline benchmark / end-to-end", () => {
  it("single chain, 50 positions", async () => {
    const start = performance.now();
    const result = await runMonitor("ethereum", 50);
    const elapsed = performance.now() - start;
    record("runMonitor(ethereum, 50)", elapsed);
    assert.ok(result.score.level);
    assert.ok(elapsed < 100, `Should be < 100ms, took ${elapsed.toFixed(1)}ms`);
  });

  it("single chain, 200 positions", async () => {
    const start = performance.now();
    const result = await runMonitor("ethereum", 200);
    const elapsed = performance.now() - start;
    record("runMonitor(ethereum, 200)", elapsed);
    assert.ok(result.score.level);
    assert.ok(elapsed < 200, `Should be < 200ms, took ${elapsed.toFixed(1)}ms`);
  });

  it("single chain, 1000 positions", async () => {
    const start = performance.now();
    const result = await runMonitor("ethereum", 1000);
    const elapsed = performance.now() - start;
    record("runMonitor(ethereum, 1000)", elapsed);
    assert.ok(result.score.level);
    assert.ok(elapsed < 500, `Should be < 500ms, took ${elapsed.toFixed(1)}ms`);
  });

  it("multi-chain (3 chains, 50 each)", async () => {
    const start = performance.now();
    const results = await runMonitorMultiChain(
      ["ethereum", "arbitrum", "base"],
      50
    );
    const elapsed = performance.now() - start;
    record("runMonitorMultiChain(3×50)", elapsed);
    assert.equal(results.length, 3);
    assert.ok(elapsed < 200, `Should be < 200ms, took ${elapsed.toFixed(1)}ms`);
  });

  it("multi-chain (3 chains, 200 each)", async () => {
    const start = performance.now();
    const results = await runMonitorMultiChain(
      ["ethereum", "arbitrum", "base"],
      200
    );
    const elapsed = performance.now() - start;
    record("runMonitorMultiChain(3×200)", elapsed);
    assert.equal(results.length, 3);
    assert.ok(elapsed < 500, `Should be < 500ms, took ${elapsed.toFixed(1)}ms`);
  });
});

// ── Print summary ────────────────────────────────────────────────────

describe("pipeline benchmark / summary", () => {
  it("prints performance table", () => {
    console.log("\n┌─────────────────────────────────────────────┬────────────┐");
    console.log("│ Stage                                       │ Duration   │");
    console.log("├─────────────────────────────────────────────┼────────────┤");
    for (const { label, durationMs } of benchResults) {
      const l = label.padEnd(43);
      const d = `${durationMs.toFixed(2)}ms`.padStart(10);
      console.log(`│ ${l} │ ${d} │`);
    }
    console.log("└─────────────────────────────────────────────┴────────────┘");
    assert.ok(true);
  });
});
