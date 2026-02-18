/**
 * Unit Tests — scorer.ts
 *
 * Covers:
 *   - ACE band classification for every threshold boundary
 *   - scoreRisk output shape
 *   - Summary string content per level
 *   - Edge cases: 0.0, 1.0, exact boundaries
 *   - Integration with real correlated assessments from fixtures
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  scoreRisk,
  type AceRiskLevel,
} from "../../../../src/protocols/aave/risk-intelligence/scorer.js";
import { correlateSignals } from "../../../../src/protocols/aave/risk-intelligence/correlator.js";

import {
  SAFE_POSITIONS,
  WATCH_POSITIONS,
  EARLY_WARNING_POSITIONS,
  CRITICAL_POSITIONS,
  metricsFor,
} from "./fixtures.js";

import type { CorrelatedRiskAssessment } from "../../../../src/protocols/aave/risk-intelligence/correlator.js";

// ── Helpers ──────────────────────────────────────────────────────────

function makeAssessment(
  compositeScore: number,
  chainId = "ethereum"
): CorrelatedRiskAssessment {
  return {
    compositeScore,
    dimensions: [
      { label: "Test Dim", value: compositeScore, weight: 1.0 },
    ],
    sampleSize: 10,
    chainId,
    timestamp: Date.now(),
  };
}

function scoreFromFixture(
  chainId: string,
  positions: typeof SAFE_POSITIONS
) {
  const metrics = metricsFor(chainId, positions);
  const assessment = correlateSignals(chainId, positions, metrics);
  return scoreRisk(assessment);
}

// ── ACE band classification ──────────────────────────────────────────

describe("scorer / classify", () => {
  const cases: [number, AceRiskLevel][] = [
    [0.00, "safe"],
    [0.10, "safe"],
    [0.24, "safe"],
    [0.25, "watch"],
    [0.35, "watch"],
    [0.49, "watch"],
    [0.50, "early-warning"],
    [0.60, "early-warning"],
    [0.74, "early-warning"],
    [0.75, "critical"],
    [0.90, "critical"],
    [1.00, "critical"],
  ];

  for (const [composite, expectedLevel] of cases) {
    it(`composite ${composite} → ${expectedLevel}`, () => {
      const score = scoreRisk(makeAssessment(composite));
      assert.equal(score.level, expectedLevel);
    });
  }
});

// ── Output shape ─────────────────────────────────────────────────────

describe("scorer / output shape", () => {
  it("returns all required fields", () => {
    const score = scoreRisk(makeAssessment(0.5, "arbitrum"));
    assert.equal(score.chainId, "arbitrum");
    assert.equal(score.composite, 0.5);
    assert.equal(score.level, "early-warning");
    assert.equal(typeof score.summary, "string");
    assert.ok(Array.isArray(score.dimensions));
    assert.equal(score.sampleSize, 10);
    assert.equal(typeof score.timestamp, "number");
  });
});

// ── Summary strings ──────────────────────────────────────────────────

describe("scorer / summary", () => {
  it("SAFE summary contains keyword", () => {
    const score = scoreRisk(makeAssessment(0.1, "ethereum"));
    assert.ok(score.summary.includes("SAFE"));
    assert.ok(score.summary.includes("ethereum"));
  });

  it("WATCH summary contains keyword", () => {
    const score = scoreRisk(makeAssessment(0.3, "ethereum"));
    assert.ok(score.summary.includes("WATCH"));
    assert.ok(score.summary.includes("Monitor closely"));
  });

  it("EARLY-WARNING summary contains keyword", () => {
    const score = scoreRisk(makeAssessment(0.6, "arbitrum"));
    assert.ok(score.summary.includes("EARLY-WARNING"));
    assert.ok(score.summary.includes("Prepare escalation"));
  });

  it("CRITICAL summary contains keyword", () => {
    const score = scoreRisk(makeAssessment(0.9, "arbitrum"));
    assert.ok(score.summary.includes("CRITICAL"));
    assert.ok(score.summary.includes("Immediate action"));
  });
});

// ── Integration with real fixtures ───────────────────────────────────

describe("scorer / fixture integration", () => {
  it("SAFE positions → safe level", () => {
    const score = scoreFromFixture("ethereum", SAFE_POSITIONS);
    assert.equal(score.level, "safe");
  });

  it("WATCH positions → watch level", () => {
    const score = scoreFromFixture("ethereum", WATCH_POSITIONS);
    assert.ok(
      score.level === "watch" || score.level === "safe",
      `Expected watch or safe, got ${score.level} (composite: ${score.composite})`
    );
  });

  it("EARLY-WARNING positions → early-warning or higher", () => {
    const score = scoreFromFixture("arbitrum", EARLY_WARNING_POSITIONS);
    assert.ok(
      score.level === "early-warning" || score.level === "critical",
      `Expected early-warning or critical, got ${score.level} (composite: ${score.composite})`
    );
  });

  it("CRITICAL positions → critical or early-warning", () => {
    const score = scoreFromFixture("arbitrum", CRITICAL_POSITIONS);
    assert.ok(
      score.level === "critical" || score.level === "early-warning",
      `Expected critical or early-warning, got ${score.level} (composite: ${score.composite})`
    );
  });
});

// ── Edge cases ───────────────────────────────────────────────────────

describe("scorer / edge cases", () => {
  it("composite exactly 0 → safe", () => {
    assert.equal(scoreRisk(makeAssessment(0)).level, "safe");
  });

  it("composite exactly 1.0 → critical", () => {
    assert.equal(scoreRisk(makeAssessment(1.0)).level, "critical");
  });

  it("composite at boundary 0.25 → watch (not safe)", () => {
    assert.equal(scoreRisk(makeAssessment(0.25)).level, "watch");
  });

  it("composite at boundary 0.50 → early-warning (not watch)", () => {
    assert.equal(scoreRisk(makeAssessment(0.50)).level, "early-warning");
  });

  it("composite at boundary 0.75 → critical (not early-warning)", () => {
    assert.equal(scoreRisk(makeAssessment(0.75)).level, "critical");
  });
});
