import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveWorkflowDefinitionId } from "../../../src/services/vault-gateway/workflow-registry.js";

describe("resolveWorkflowDefinitionId", () => {
  it("defaults cre.workflow to aave-risk-monitor", () => {
    assert.equal(resolveWorkflowDefinitionId("cre.workflow", undefined), "aave-risk-monitor");
  });

  it("uses env override when provided", () => {
    assert.equal(
      resolveWorkflowDefinitionId("cre.workflow", "custom-wf"),
      "custom-wf"
    );
  });

  it("maps aave.buffer.top_up to aave-buffer-top-up", () => {
    assert.equal(
      resolveWorkflowDefinitionId("aave.buffer.top_up", undefined),
      "aave-buffer-top-up"
    );
  });

  it("maps aave.vault.protect to aave-vault-protect", () => {
    assert.equal(
      resolveWorkflowDefinitionId("aave.vault.protect", undefined),
      "aave-vault-protect"
    );
  });
});
