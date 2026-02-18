/**
 * Uniswap Intelligent Agent — Unit Tests
 *
 * Bounded context: Uniswap / AI Agents
 *
 * Verifies that the Uniswap decision function:
 *   - Returns CRITICAL for extreme price impact
 *   - Returns HIGH for significant price impact
 *   - Returns MEDIUM for high volatility
 *   - Returns null for low risk
 *   - Is a pure function (no side effects, no CRE dependency)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decideUniswapAction } from "../../../../src/protocols/uniswap/ai-agents/uniswap-intelligent-agent.js";

describe("decideUniswapAction", () => {
  const agentId = "uniswap-agent-test";

  it("should return CRITICAL for extreme price impact (>10%)", () => {
    const result = decideUniswapAction(agentId, {
      priceImpact: 0.15,
      poolLiquidity: 1_000_000,
      volatility: 0.5,
    });

    assert.ok(result, "Expected non-null result");
    assert.equal(result.riskLevel, "CRITICAL");
    assert.equal(result.action, "ESCALATE");
    assert.equal(result.requiresConfidentiality, true);
  });

  it("should return HIGH for significant price impact (>5%)", () => {
    const result = decideUniswapAction(agentId, {
      priceImpact: 0.07,
      poolLiquidity: 5_000_000,
      volatility: 0.3,
    });

    assert.ok(result, "Expected non-null result");
    assert.equal(result.riskLevel, "HIGH");
    assert.equal(result.action, "PROTECT_POSITION");
    assert.equal(result.requiresConfidentiality, false);
  });

  it("should return MEDIUM for high volatility (>0.8)", () => {
    const result = decideUniswapAction(agentId, {
      priceImpact: 0.02,
      poolLiquidity: 10_000_000,
      volatility: 0.9,
    });

    assert.ok(result, "Expected non-null result");
    assert.equal(result.riskLevel, "MEDIUM");
    assert.equal(result.action, "NOTIFY");
  });

  it("should return null for low risk", () => {
    const result = decideUniswapAction(agentId, {
      priceImpact: 0.01,
      poolLiquidity: 50_000_000,
      volatility: 0.3,
    });

    assert.equal(result, null);
  });

  it("should be a pure function with no side effects", () => {
    const snapshot = {
      priceImpact: 0.15,
      poolLiquidity: 1_000_000,
      volatility: 0.5,
    };

    const result1 = decideUniswapAction(agentId, snapshot);
    const result2 = decideUniswapAction(agentId, snapshot);

    assert.deepEqual(result1, result2);
  });
});
