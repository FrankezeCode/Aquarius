/**
 * Unit Tests — signals.ts
 *
 * Covers:
 *   - fetchPositionSnapshots returns correct count & shape
 *   - deriveChainMetrics empty array edge case
 *   - deriveChainMetrics with known fixtures (safe, critical)
 *   - fetchChainMetrics convenience wrapper
 *   - Median calculation for even/odd counts
 *   - positionsAtRisk threshold logic
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  fetchPositionSnapshots,
  deriveChainMetrics,
  fetchChainMetrics,
} from "../../../../src/protocols/aave/risk-intelligence/signals.js";

import {
  SAFE_POSITIONS,
  CRITICAL_POSITIONS,
  EMPTY_POSITIONS,
  SINGLE_POSITION,
  metricsFor,
} from "./fixtures.js";

// ── fetchPositionSnapshots ───────────────────────────────────────────

describe("signals / fetchPositionSnapshots", () => {
  it("returns the requested number of positions", async () => {
    const positions = await fetchPositionSnapshots("ethereum", 20);
    assert.equal(positions.length, 20);
  });

  it("defaults to 50 positions", async () => {
    const positions = await fetchPositionSnapshots("ethereum");
    assert.equal(positions.length, 50);
  });

  it("each position has all required fields", async () => {
    const positions = await fetchPositionSnapshots("arbitrum", 5);
    for (const p of positions) {
      assert.equal(typeof p.owner, "string");
      assert.equal(p.chainId, "arbitrum");
      assert.equal(typeof p.healthFactor, "number");
      assert.ok(p.healthFactor >= 1.0, "HF should be >= 1.0");
      assert.equal(typeof p.collateralUsd, "number");
      assert.ok(p.collateralUsd > 0);
      assert.equal(typeof p.debtUsd, "number");
      assert.ok(p.debtUsd > 0);
      assert.equal(typeof p.liquidationProximity, "number");
      assert.equal(typeof p.timestamp, "number");
    }
  });

  it("returns positions for different chains", async () => {
    const eth = await fetchPositionSnapshots("ethereum", 3);
    const arb = await fetchPositionSnapshots("arbitrum", 3);
    assert.equal(eth[0]!.chainId, "ethereum");
    assert.equal(arb[0]!.chainId, "arbitrum");
  });
});

// ── deriveChainMetrics ───────────────────────────────────────────────

describe("signals / deriveChainMetrics", () => {
  it("handles empty positions", () => {
    const m = deriveChainMetrics("ethereum", EMPTY_POSITIONS);
    assert.equal(m.totalPositions, 0);
    assert.equal(m.avgHealthFactor, 0);
    assert.equal(m.medianHealthFactor, 0);
    assert.equal(m.positionsAtRisk, 0);
    assert.equal(m.totalCollateralUsd, 0);
    assert.equal(m.totalDebtUsd, 0);
    assert.equal(m.chainId, "ethereum");
  });

  it("computes correct metrics for SAFE positions", () => {
    const m = deriveChainMetrics("ethereum", SAFE_POSITIONS);
    const expected = metricsFor("ethereum", SAFE_POSITIONS);
    assert.equal(m.totalPositions, 10);
    assert.equal(m.avgHealthFactor, expected.avgHealthFactor);
    assert.equal(m.positionsAtRisk, 0, "No safe positions should be at risk");
    assert.ok(m.totalCollateralUsd > 0);
    assert.ok(m.totalDebtUsd > 0);
    assert.ok(m.totalDebtUsd < m.totalCollateralUsd, "Debt < Collateral for safe");
  });

  it("computes correct metrics for CRITICAL positions", () => {
    const m = deriveChainMetrics("arbitrum", CRITICAL_POSITIONS);
    assert.equal(m.totalPositions, 10);
    // All critical positions have HF < 1.25
    assert.equal(m.positionsAtRisk, 10, "All critical positions should be at risk");
    assert.ok(m.avgHealthFactor < 1.25);
  });

  it("single position: median equals the only HF", () => {
    const m = deriveChainMetrics("base", SINGLE_POSITION);
    assert.equal(m.totalPositions, 1);
    assert.equal(m.medianHealthFactor, 1.5);
    assert.equal(m.avgHealthFactor, 1.5);
  });

  it("even count: median is average of two middle values", () => {
    const m = deriveChainMetrics("ethereum", SAFE_POSITIONS);
    // 10 positions (even), verify median is between min and max HF
    assert.ok(m.medianHealthFactor >= 2.5);
    assert.ok(m.medianHealthFactor <= 3.5);
  });
});

// ── fetchChainMetrics (convenience) ──────────────────────────────────

describe("signals / fetchChainMetrics", () => {
  it("returns valid metrics for any chain", async () => {
    const m = await fetchChainMetrics("ethereum", 10);
    assert.equal(m.chainId, "ethereum");
    assert.equal(m.totalPositions, 10);
    assert.ok(m.avgHealthFactor > 0);
    assert.equal(typeof m.timestamp, "number");
  });
});
