/**
 * Unit Tests — correlator.ts
 *
 * Covers:
 *   - correlateSignals with all fixture scenarios
 *   - Composite score ranges for each risk band
 *   - Dimension labels and weight verification
 *   - Empty positions edge case
 *   - Single position edge case
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { correlateSignals } from "../../../../src/protocols/aave/risk-intelligence/correlator.js";

import {
  SAFE_POSITIONS,
  WATCH_POSITIONS,
  EARLY_WARNING_POSITIONS,
  CRITICAL_POSITIONS,
  EMPTY_POSITIONS,
  SINGLE_POSITION,
  metricsFor,
} from "./fixtures.js";

// ── Helpers ──────────────────────────────────────────────────────────

function correlate(chainId: string, positions: typeof SAFE_POSITIONS) {
  const metrics = metricsFor(chainId, positions);
  return correlateSignals(chainId, positions, metrics);
}

// ── Shape validation ─────────────────────────────────────────────────

describe("correlator / output shape", () => {
  it("returns all required fields", () => {
    const result = correlate("ethereum", SAFE_POSITIONS);
    assert.equal(typeof result.compositeScore, "number");
    assert.ok(Array.isArray(result.dimensions));
    assert.equal(result.dimensions.length, 4);
    assert.equal(result.chainId, "ethereum");
    assert.equal(result.sampleSize, SAFE_POSITIONS.length);
    assert.equal(typeof result.timestamp, "number");
  });

  it("dimensions have correct labels", () => {
    const result = correlate("ethereum", SAFE_POSITIONS);
    const labels = result.dimensions.map((d) => d.label);
    assert.ok(labels.includes("Health-Factor Pressure"));
    assert.ok(labels.includes("Liquidation Proximity"));
    assert.ok(labels.includes("Market Concentration"));
    assert.ok(labels.includes("Debt-to-Collateral Ratio"));
  });

  it("weights sum to 1.0", () => {
    const result = correlate("ethereum", SAFE_POSITIONS);
    const totalWeight = result.dimensions.reduce((s, d) => s + d.weight, 0);
    assert.ok(
      Math.abs(totalWeight - 1.0) < 0.001,
      `Weights should sum to 1.0, got ${totalWeight}`
    );
  });

  it("each dimension value is 0..1", () => {
    const result = correlate("arbitrum", CRITICAL_POSITIONS);
    for (const d of result.dimensions) {
      assert.ok(d.value >= 0, `${d.label} value should be >= 0, got ${d.value}`);
      assert.ok(d.value <= 1, `${d.label} value should be <= 1, got ${d.value}`);
    }
  });
});

// ── Composite score ranges per scenario ──────────────────────────────

describe("correlator / SAFE scenario", () => {
  it("composite score is low (< 0.25)", () => {
    const result = correlate("ethereum", SAFE_POSITIONS);
    assert.ok(
      result.compositeScore < 0.25,
      `SAFE composite should be < 0.25, got ${result.compositeScore}`
    );
  });

  it("HF pressure dimension is near 0", () => {
    const result = correlate("ethereum", SAFE_POSITIONS);
    const hfDim = result.dimensions.find((d) => d.label === "Health-Factor Pressure")!;
    assert.ok(hfDim.value < 0.2, `HF pressure for safe should be < 0.2, got ${hfDim.value}`);
  });
});

describe("correlator / WATCH scenario", () => {
  it("composite score is moderate (0.15 – 0.50)", () => {
    const result = correlate("ethereum", WATCH_POSITIONS);
    assert.ok(
      result.compositeScore >= 0.15 && result.compositeScore < 0.50,
      `WATCH composite should be 0.15-0.50, got ${result.compositeScore}`
    );
  });
});

describe("correlator / EARLY-WARNING scenario", () => {
  it("composite score is elevated (>= 0.50)", () => {
    const result = correlate("arbitrum", EARLY_WARNING_POSITIONS);
    assert.ok(
      result.compositeScore >= 0.50 && result.compositeScore <= 1.0,
      `EARLY-WARNING composite should be >= 0.50, got ${result.compositeScore}`
    );
  });

  it("liquidation proximity dimension is high", () => {
    const result = correlate("arbitrum", EARLY_WARNING_POSITIONS);
    const liqDim = result.dimensions.find((d) => d.label === "Liquidation Proximity")!;
    assert.ok(
      liqDim.value >= 0.5,
      `Liquidation proximity for early-warning should be >= 0.5, got ${liqDim.value}`
    );
  });
});

describe("correlator / CRITICAL scenario", () => {
  it("composite score is high (>= 0.65)", () => {
    const result = correlate("arbitrum", CRITICAL_POSITIONS);
    assert.ok(
      result.compositeScore >= 0.65,
      `CRITICAL composite should be >= 0.65, got ${result.compositeScore}`
    );
  });

  it("all dimension values are elevated", () => {
    const result = correlate("arbitrum", CRITICAL_POSITIONS);
    for (const d of result.dimensions) {
      assert.ok(
        d.value >= 0.3,
        `CRITICAL ${d.label} should be elevated (>= 0.3), got ${d.value}`
      );
    }
  });
});

// ── Edge cases ───────────────────────────────────────────────────────

describe("correlator / edge cases", () => {
  it("empty positions → composite reflects HF-pressure from zero avg HF", () => {
    const result = correlate("ethereum", EMPTY_POSITIONS);
    // With 0 positions, avgHealthFactor = 0, so hfToRisk(0) = 1.0
    // HF-pressure dimension: 1.0 × 0.40 = 0.40
    // All other dimensions: 0 (no positions to compute from)
    // Composite ≈ 0.40
    assert.ok(
      result.compositeScore >= 0.39 && result.compositeScore <= 0.41,
      `Empty positions composite should be ~0.40 (HF pressure only), got ${result.compositeScore}`
    );
    assert.equal(result.sampleSize, 0);
  });

  it("single position → valid composite", () => {
    const result = correlate("base", SINGLE_POSITION);
    assert.equal(result.sampleSize, 1);
    assert.ok(result.compositeScore >= 0);
    assert.ok(result.compositeScore <= 1);
  });
});
