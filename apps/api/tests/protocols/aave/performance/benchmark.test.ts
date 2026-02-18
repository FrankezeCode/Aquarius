/**
 * Performance Benchmark Suite — Aave Risk + CCIP Architecture
 *
 * Measures latency, throughput, and memory stability of:
 *   1. runMonitor() hot path
 *   2. dispatchCrossChainRisk() scheduling overhead
 *   3. Combined pipeline throughput (monitor + dispatch)
 *   4. Memory stability under burst load
 *
 * Uses process.hrtime.bigint() for nanosecond precision.
 *
 * These are NOT functional tests — they do NOT assert strict timing
 * thresholds to avoid CI flakiness. Results are printed as structured
 * JSON for analysis.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runMonitor } from "../../../../src/protocols/aave/risk-intelligence/monitor.js";
import { dispatchCrossChainRisk } from "../../../../src/protocols/aave/ccip/sender.js";
import type { CrossChainRiskSignal } from "../../../../src/protocols/aave/risk-intelligence/domain-events.js";

// ── Helpers ──────────────────────────────────────────────────────────

function nsToMs(ns: bigint): number {
  return Number(ns) / 1_000_000;
}

function makeSignal(
  overrides?: Partial<CrossChainRiskSignal>
): CrossChainRiskSignal {
  return {
    sourceChain: "ethereum",
    workflowId: "aave-risk-ethereum",
    riskLevel: "critical",
    composite: 0.85,
    timestamp: Date.now(),
    ...overrides,
  };
}

// Suppress console.info during benchmark loops to avoid I/O overhead
// contaminating timing measurements. Restored after each test.
function silenceConsole(): () => void {
  const original = console.info;
  console.info = () => {};
  return () => {
    console.info = original;
  };
}

// ── BENCHMARK 1: Monitor Hot Path ────────────────────────────────────

describe("Benchmark: runMonitor hot path", () => {
  it("10k iterations — latency profile", async () => {
    const iterations = 10_000;
    const warmupRounds = 100;
    const restore = silenceConsole();

    try {
      // ── Warm-up (not timed) ──
      for (let i = 0; i < warmupRounds; i++) {
        await runMonitor("ethereum", 10);
      }

      // ── Benchmark ──
      const start = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        await runMonitor("ethereum", 10);
      }
      const end = process.hrtime.bigint();

      const totalNs = end - start;
      const totalMs = nsToMs(totalNs);
      const avgNs = Number(totalNs) / iterations;
      const avgMs = totalMs / iterations;

      restore();

      console.info(
        JSON.stringify(
          {
            test: "runMonitor hot path",
            iterations,
            warmupRounds,
            positionLimit: 10,
            totalMs: Math.round(totalMs * 100) / 100,
            avgNs: Math.round(avgNs),
            avgMs: Math.round(avgMs * 1000) / 1000,
            throughputOpsPerSec: Math.round(iterations / (totalMs / 1000)),
          },
          null,
          2
        )
      );

      // Sanity: test completed without error
      assert.ok(totalMs > 0, "Benchmark must record positive time");
    } catch (e) {
      restore();
      throw e;
    }
  });
});

// ── BENCHMARK 2: Dispatch Scheduling Overhead ────────────────────────

describe("Benchmark: dispatchCrossChainRisk scheduling overhead", () => {
  it("10k iterations — scheduling cost", () => {
    const iterations = 10_000;
    const warmupRounds = 100;
    const signal = makeSignal();
    const restore = silenceConsole();

    try {
      // ── Warm-up ──
      for (let i = 0; i < warmupRounds; i++) {
        dispatchCrossChainRisk(signal);
      }

      // ── Benchmark ──
      const start = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        const result = dispatchCrossChainRisk(signal);
        // Ensure function returns void (not a Promise)
        if (result !== undefined) {
          throw new Error("dispatchCrossChainRisk must return void");
        }
      }
      const end = process.hrtime.bigint();

      const totalNs = end - start;
      const totalMs = nsToMs(totalNs);
      const avgNs = Number(totalNs) / iterations;
      const avgMs = totalMs / iterations;

      restore();

      console.info(
        JSON.stringify(
          {
            test: "dispatchCrossChainRisk scheduling overhead",
            iterations,
            warmupRounds,
            totalMs: Math.round(totalMs * 100) / 100,
            avgNs: Math.round(avgNs),
            avgMs: Math.round(avgMs * 1000) / 1000,
            throughputOpsPerSec: Math.round(iterations / (totalMs / 1000)),
            note: "Measures scheduling cost only, not async execution",
          },
          null,
          2
        )
      );

      assert.ok(totalMs > 0, "Benchmark must record positive time");
    } catch (e) {
      restore();
      throw e;
    }
  });
});

// ── BENCHMARK 3: Combined Pipeline Throughput ────────────────────────

describe("Benchmark: Combined monitor + dispatch burst", () => {
  it("10k iterations — full pipeline with 10% critical dispatch", async () => {
    const iterations = 10_000;
    const warmupRounds = 50;
    let dispatchCount = 0;
    const restore = silenceConsole();

    try {
      // ── Warm-up ──
      for (let i = 0; i < warmupRounds; i++) {
        await runMonitor("ethereum", 10);
      }

      // ── Benchmark ──
      const start = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        const result = await runMonitor("ethereum", 10);

        // ~10% of iterations: if monitor emits a crossChainSignal,
        // dispatch it. Since mock data is stochastic, we also
        // synthetically dispatch on every 10th iteration to ensure
        // we exercise the dispatch path.
        if (result.crossChainSignal) {
          dispatchCrossChainRisk(result.crossChainSignal);
          dispatchCount++;
        } else if (i % 10 === 0) {
          dispatchCrossChainRisk(makeSignal());
          dispatchCount++;
        }
      }
      const end = process.hrtime.bigint();

      const totalNs = end - start;
      const totalMs = nsToMs(totalNs);
      const avgNs = Number(totalNs) / iterations;
      const avgMs = totalMs / iterations;

      restore();

      console.info(
        JSON.stringify(
          {
            test: "Combined monitor + dispatch burst",
            iterations,
            warmupRounds,
            positionLimit: 10,
            totalMs: Math.round(totalMs * 100) / 100,
            avgNs: Math.round(avgNs),
            avgMs: Math.round(avgMs * 1000) / 1000,
            throughputOpsPerSec: Math.round(iterations / (totalMs / 1000)),
            dispatchCount,
            dispatchRatio:
              Math.round((dispatchCount / iterations) * 10000) / 100 + "%",
          },
          null,
          2
        )
      );

      assert.ok(totalMs > 0, "Benchmark must record positive time");
      assert.ok(dispatchCount > 0, "At least some dispatches must occur");
    } catch (e) {
      restore();
      throw e;
    }
  });
});

// ── BENCHMARK 4: Memory Stability ────────────────────────────────────

describe("Benchmark: Memory stability under 10k burst", () => {
  it("10k iterations — heap delta", async () => {
    const iterations = 10_000;
    const restore = silenceConsole();

    try {
      // Force GC if exposed (node --expose-gc), otherwise skip
      if (typeof globalThis.gc === "function") {
        globalThis.gc();
      }

      const heapBefore = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        const result = await runMonitor("ethereum", 10);
        if (result.crossChainSignal) {
          dispatchCrossChainRisk(result.crossChainSignal);
        } else if (i % 10 === 0) {
          dispatchCrossChainRisk(makeSignal());
        }
      }

      const heapAfter = process.memoryUsage().heapUsed;
      const deltaMB =
        Math.round(((heapAfter - heapBefore) / 1024 / 1024) * 100) / 100;

      restore();

      console.info(
        JSON.stringify(
          {
            test: "Memory stability under 10k burst",
            iterations,
            heapBeforeMB:
              Math.round((heapBefore / 1024 / 1024) * 100) / 100,
            heapAfterMB:
              Math.round((heapAfter / 1024 / 1024) * 100) / 100,
            deltaMB,
            note: "Negative delta possible due to GC during run",
          },
          null,
          2
        )
      );

      // Do NOT fail based on memory — just report
      assert.ok(true, "Memory benchmark completed");
    } catch (e) {
      restore();
      throw e;
    }
  });
});
