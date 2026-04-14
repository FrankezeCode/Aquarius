/**
 * Integration tests — POST /api/v1/vault-gateway/intents
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { resetCreOrchestrationAdapterForTests } from "../../src/infrastructure/orchestration/index.js";

const ENV_KEYS = [
  "VAULT_GATEWAY_EXECUTION_ENABLED",
  "VAULT_GATEWAY_INTENT_TOKEN",
  "ORCHESTRATION_EXECUTION_MODE",
  "CRE_VAULT_WORKFLOW_TRIGGER_URL",
  "DATA_PROVIDER_MODE",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];
const snapshot: Partial<Record<EnvKey, string | undefined>> = {};

function captureEnv(): void {
  for (const k of ENV_KEYS) {
    snapshot[k] = process.env[k];
  }
}

function restoreEnv(): void {
  for (const k of ENV_KEYS) {
    const v = snapshot[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("POST /api/v1/vault-gateway/intents", () => {
  beforeEach(() => {
    captureEnv();
    resetCreOrchestrationAdapterForTests();
    process.env.VAULT_GATEWAY_EXECUTION_ENABLED = "true";
    process.env.VAULT_GATEWAY_INTENT_TOKEN = "phase3-test-token";
    process.env.ORCHESTRATION_EXECUTION_MODE = "mock";
  });

  afterEach(() => {
    resetCreOrchestrationAdapterForTests();
    restoreEnv();
  });

  it("returns 403 when execution is disabled", async () => {
    process.env.VAULT_GATEWAY_EXECUTION_ENABLED = "false";
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers: {
        authorization: "Bearer phase3-test-token",
        "content-type": "application/json",
      },
      payload: {
        intentType: "cre.workflow",
        chain: "ethereum",
        asset: "USDC",
        amount: "1",
        idempotencyKey: "idem-403",
      },
    });
    assert.equal(res.statusCode, 403);
    const body = res.json() as { kind?: string; reasonCode?: string };
    assert.equal(body.kind, "rejected");
    assert.equal(body.reasonCode, "EXECUTION_DISABLED");
  });

  it("returns 401 without valid Bearer token", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers: { "content-type": "application/json" },
      payload: {
        intentType: "cre.workflow",
        chain: "ethereum",
        asset: "USDC",
        amount: "1",
        idempotencyKey: "idem-401",
      },
    });
    assert.equal(res.statusCode, 401);
    const body = res.json() as { kind?: string; reasonCode?: string };
    assert.equal(body.kind, "rejected");
    assert.equal(body.reasonCode, "UNAUTHORIZED");
  });

  it("returns 400 for invalid body", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers: {
        authorization: "Bearer phase3-test-token",
        "content-type": "application/json",
      },
      payload: { intentType: "cre.workflow" },
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { kind?: string; reasonCode?: string };
    assert.equal(body.kind, "rejected");
    assert.equal(body.reasonCode, "VALIDATION_ERROR");
  });

  it("returns 422 for non-executable chain (og_chain)", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers: {
        authorization: "Bearer phase3-test-token",
        "content-type": "application/json",
      },
      payload: {
        intentType: "cre.workflow",
        chain: "0g",
        asset: "OG",
        amount: "1",
        idempotencyKey: "idem-og",
        correlationId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      },
    });
    assert.equal(res.statusCode, 422);
    const body = res.json() as { kind?: string; reasonCode?: string };
    assert.equal(body.kind, "rejected");
    assert.equal(body.reasonCode, "CHAIN_NOT_EXECUTABLE");
  });

  it("returns 202 submitted with stable correlationId in mock mode", async () => {
    const app = await buildApp();
    const correlationId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers: {
        authorization: "Bearer phase3-test-token",
        "content-type": "application/json",
      },
      payload: {
        intentType: "cre.workflow",
        chain: "ethereum",
        asset: "USDC",
        amount: "100",
        idempotencyKey: "idem-202-a",
        correlationId,
      },
    });
    assert.equal(res.statusCode, 202);
    const body = res.json() as {
      kind?: string;
      correlationId?: string;
      jobId?: string;
      workflowId?: string;
      status?: string;
    };
    assert.equal(body.kind, "submitted");
    assert.equal(body.correlationId, correlationId);
    assert.ok(body.jobId?.startsWith("cre-job-"));
    assert.equal(body.workflowId, body.jobId);
    assert.equal(body.status, "accepted");
  });

  it("returns identical body for duplicate idempotency key (200 on replay)", async () => {
    const app = await buildApp();
    const idempotencyKey = "idem-dedupe-1";
    const headers = {
      authorization: "Bearer phase3-test-token",
      "content-type": "application/json",
    };
    const payload = {
      intentType: "cre.workflow" as const,
      chain: "ethereum",
      asset: "USDC",
      amount: "50",
      idempotencyKey,
    };

    const first = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers,
      payload,
    });
    assert.equal(first.statusCode, 202);
    const firstBody = first.json() as Record<string, unknown>;

    const second = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers,
      payload: { ...payload, correlationId: "dddddddd-dddd-dddd-dddd-dddddddddddd" },
    });
    assert.equal(second.statusCode, 200);
    const secondBody = second.json() as Record<string, unknown>;
    assert.deepEqual(secondBody, firstBody);
  });

  it("live async path: POST returns orchestrationStatus running and GET reaches completed or failed", async () => {
    process.env.ORCHESTRATION_EXECUTION_MODE = "live";
    delete process.env.CRE_VAULT_WORKFLOW_TRIGGER_URL;
    process.env.DATA_PROVIDER_MODE = "mock";
    resetCreOrchestrationAdapterForTests();

    const app = await buildApp();
    const idempotencyKey = `idem-live-e2e-${Date.now()}`;
    const post = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers: {
        authorization: "Bearer phase3-test-token",
        "content-type": "application/json",
      },
      payload: {
        intentType: "cre.workflow",
        chain: "ethereum",
        asset: "USDC",
        amount: "1",
        idempotencyKey,
        correlationId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      },
    });
    assert.equal(post.statusCode, 202);
    const p = post.json() as {
      orchestrationStatus?: string;
      jobId?: string;
    };
    assert.equal(p.orchestrationStatus, "running");
    assert.ok(p.jobId?.startsWith("cre-job-"));

    let lastStatus: string | undefined;
    for (let i = 0; i < 120; i++) {
      const g = await app.inject({
        method: "GET",
        url: `/api/v1/vault-gateway/jobs/${p.jobId}`,
        headers: { authorization: "Bearer phase3-test-token" },
      });
      assert.equal(g.statusCode, 200);
      const gj = g.json() as { status?: string };
      lastStatus = gj.status;
      if (gj.status === "completed" || gj.status === "failed") {
        break;
      }
      assert.equal(gj.status, "running");
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.ok(
      lastStatus === "completed" || lastStatus === "failed",
      `expected terminal job status, got ${lastStatus}`
    );
  });

  it("aave.buffer.top_up in mock mode maps workflow id and exposes vaultTrace on GET", async () => {
    const app = await buildApp();
    const idempotencyKey = `idem-buffer-mock-${Date.now()}`;
    const post = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers: {
        authorization: "Bearer phase3-test-token",
        "content-type": "application/json",
      },
      payload: {
        intentType: "aave.buffer.top_up",
        chain: "ethereum",
        asset: "USDC",
        amount: "10",
        idempotencyKey,
      },
    });
    assert.equal(post.statusCode, 202);
    const p = post.json() as {
      workflowDefinitionId?: string;
      jobId?: string;
    };
    assert.equal(p.workflowDefinitionId, "aave-buffer-top-up");
    assert.ok(p.jobId?.startsWith("cre-job-"));

    const g = await app.inject({
      method: "GET",
      url: `/api/v1/vault-gateway/jobs/${p.jobId}?includeResult=true`,
      headers: { authorization: "Bearer phase3-test-token" },
    });
    assert.equal(g.statusCode, 200);
    const gj = g.json() as { result?: { vaultTrace?: { command: string } } };
    assert.equal(gj.result?.vaultTrace?.command, "buffer_top_up");
  });
});
