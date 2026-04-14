/**
 * Gateway forwards POST body to OrchestrationPort only — mock orchestration (no CRE / protocol I/O).
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";
import fastify from "fastify";
import type {
  OrchestrationPort,
  OrchestrationSubmitResult,
} from "../../src/application/ports/orchestration.port.js";
import { registerVaultGatewayPostIntents } from "../../src/routes/v1/vault-gateway/post-intents.js";

describe("POST /intents with mock OrchestrationPort", () => {
  let app: FastifyInstance;
  let lastIntent: Parameters<OrchestrationPort["submitIntent"]>[0] | null;

  beforeEach(async () => {
    lastIntent = null;
    const orchestration: OrchestrationPort = {
      async submitIntent(intent) {
        lastIntent = intent;
        const out: OrchestrationSubmitResult = {
          jobId: "mock-job-id",
          status: "completed",
          workflowDefinitionId: "wf-mock",
        };
        return out;
      },
      async getJobStatus() {
        return null;
      },
    };
    app = fastify();
    await app.register(registerVaultGatewayPostIntents, { orchestration });
    process.env.VAULT_GATEWAY_EXECUTION_ENABLED = "true";
    process.env.VAULT_GATEWAY_INTENT_TOKEN = "mock-orch-token";
  });

  afterEach(async () => {
    await app.close();
    delete process.env.VAULT_GATEWAY_EXECUTION_ENABLED;
    delete process.env.VAULT_GATEWAY_INTENT_TOKEN;
  });

  it("forwards aave.buffer.top_up envelope fields to submitIntent", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/intents",
      headers: {
        authorization: "Bearer mock-orch-token",
        "content-type": "application/json",
      },
      payload: {
        intentType: "aave.buffer.top_up",
        chain: "ethereum",
        asset: "USDC",
        amount: "50",
        idempotencyKey: "idem-mock-buffer-1",
      },
    });
    assert.equal(res.statusCode, 202);
    assert.equal(lastIntent?.type, "vault.intent");
    if (lastIntent?.type !== "vault.intent") throw new Error("expected vault.intent");
    assert.equal(lastIntent.envelope.intentType, "aave.buffer.top_up");
    assert.equal(lastIntent.envelope.normalizedAsset, "USDC");
    assert.equal(lastIntent.envelope.creChainId, "ethereum");
  });

  it("forwards aave.vault.protect with aqAssetId and riskLevel", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/intents",
      headers: {
        authorization: "Bearer mock-orch-token",
        "content-type": "application/json",
      },
      payload: {
        intentType: "aave.vault.protect",
        chain: "arbitrum",
        asset: "WETH",
        amount: "0",
        idempotencyKey: "idem-mock-protect-1",
        aqAssetId: "aq-test-123",
        riskLevel: "critical",
      },
    });
    assert.equal(res.statusCode, 202);
    if (lastIntent?.type !== "vault.intent") throw new Error("expected vault.intent");
    assert.equal(lastIntent.envelope.intentType, "aave.vault.protect");
    if (lastIntent.envelope.intentType !== "aave.vault.protect") {
      throw new Error("expected protect");
    }
    assert.equal(lastIntent.envelope.aqAssetId, "aq-test-123");
    assert.equal(lastIntent.envelope.riskLevel, "critical");
  });
});
