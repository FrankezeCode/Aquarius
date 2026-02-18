/**
 * Lido Intelligent Agent — Unit Tests
 *
 * Bounded context: Lido / AI Agents
 *
 * Verifies that the Lido decision function:
 *   - Returns CRITICAL for severely degraded validator health
 *   - Returns HIGH for deteriorating validator health
 *   - Returns MEDIUM for low staking APR
 *   - Returns null for healthy conditions
 *   - Is a pure function (no side effects, no CRE dependency)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decideLidoAction } from "../../../../src/protocols/lido/ai-agents/lido-intelligent-agent.js";

describe("decideLidoAction", () => {
  const agentId = "lido-agent-test";

  it("should return CRITICAL for severely degraded validator health (<0.3)", () => {
    const result = decideLidoAction(agentId, {
      validatorHealth: 0.2,
      stakingAPR: 4.0,
    });

    assert.ok(result, "Expected non-null result");
    assert.equal(result.riskLevel, "CRITICAL");
    assert.equal(result.action, "ESCALATE");
    assert.equal(result.requiresConfidentiality, true);
  });

  it("should return HIGH for deteriorating validator health (<0.5)", () => {
    const result = decideLidoAction(agentId, {
      validatorHealth: 0.4,
      stakingAPR: 4.0,
    });

    assert.ok(result, "Expected non-null result");
    assert.equal(result.riskLevel, "HIGH");
    assert.equal(result.action, "PROTECT_POSITION");
    assert.equal(result.requiresConfidentiality, false);
  });

  it("should return MEDIUM for low staking APR (<2.0)", () => {
    const result = decideLidoAction(agentId, {
      validatorHealth: 0.8,
      stakingAPR: 1.5,
    });

    assert.ok(result, "Expected non-null result");
    assert.equal(result.riskLevel, "MEDIUM");
    assert.equal(result.action, "NOTIFY");
  });

  it("should return null for healthy conditions", () => {
    const result = decideLidoAction(agentId, {
      validatorHealth: 0.9,
      stakingAPR: 5.0,
    });

    assert.equal(result, null);
  });

  it("should be a pure function with no side effects", () => {
    const snapshot = {
      validatorHealth: 0.2,
      stakingAPR: 4.0,
    };

    const result1 = decideLidoAction(agentId, snapshot);
    const result2 = decideLidoAction(agentId, snapshot);

    assert.deepEqual(result1, result2);
  });
});
