/**
 * Integration tests — GET /api/v1/vault-gateway/jobs/:jobId
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { resetCreOrchestrationAdapterForTests } from "../../src/infrastructure/orchestration/index.js";

const ENV_KEYS = [
  "VAULT_GATEWAY_EXECUTION_ENABLED",
  "VAULT_GATEWAY_INTENT_TOKEN",
  "ORCHESTRATION_EXECUTION_MODE",
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

describe("GET /api/v1/vault-gateway/jobs/:jobId", () => {
  beforeEach(() => {
    captureEnv();
    resetCreOrchestrationAdapterForTests();
    process.env.VAULT_GATEWAY_EXECUTION_ENABLED = "true";
    process.env.VAULT_GATEWAY_INTENT_TOKEN = "phase4-get-job-token";
    process.env.ORCHESTRATION_EXECUTION_MODE = "mock";
  });

  afterEach(() => {
    resetCreOrchestrationAdapterForTests();
    restoreEnv();
  });

  it("returns 401 without Bearer", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/vault-gateway/jobs/cre-job-test",
    });
    assert.equal(res.statusCode, 401);
  });

  it("returns 404 for unknown job", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/vault-gateway/jobs/cre-job-nonexistent-0000",
      headers: { authorization: "Bearer phase4-get-job-token" },
    });
    assert.equal(res.statusCode, 404);
  });

  it("returns status after POST creates a job", async () => {
    const app = await buildApp();
    const post = await app.inject({
      method: "POST",
      url: "/api/v1/vault-gateway/intents",
      headers: {
        authorization: "Bearer phase4-get-job-token",
        "content-type": "application/json",
      },
      payload: {
        intentType: "cre.workflow",
        chain: "ethereum",
        asset: "USDC",
        amount: "1",
        idempotencyKey: "idem-get-job-1",
        correlationId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      },
    });
    assert.equal(post.statusCode, 202);
    const p = post.json() as { jobId?: string };
    assert.ok(p.jobId);

    const get = await app.inject({
      method: "GET",
      url: `/api/v1/vault-gateway/jobs/${p.jobId}`,
      headers: { authorization: "Bearer phase4-get-job-token" },
    });
    assert.equal(get.statusCode, 200);
    const g = get.json() as { kind?: string; status?: string; jobId?: string };
    assert.equal(g.kind, "status");
    assert.equal(g.jobId, p.jobId);
    assert.equal(g.status, "completed");
  });
});
