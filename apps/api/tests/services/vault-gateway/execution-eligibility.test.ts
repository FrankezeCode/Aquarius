import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateVaultExecutionEligibility } from "../../../src/services/vault-gateway/execution-eligibility.js";

describe("evaluateVaultExecutionEligibility", () => {
  it("accepts ethereum", () => {
    const r = evaluateVaultExecutionEligibility("ethereum", "USDC");
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.creChainId, "ethereum");
      assert.equal(r.normalizedAsset, "USDC");
    }
  });

  it("rejects og_chain alias", () => {
    const r = evaluateVaultExecutionEligibility("0g", "OG");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.reasonCode, "CHAIN_NOT_EXECUTABLE");
    }
  });

  it("rejects unknown chain", () => {
    const r = evaluateVaultExecutionEligibility("unknownchain", "USDC");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.reasonCode, "UNSUPPORTED_CHAIN");
    }
  });
});
