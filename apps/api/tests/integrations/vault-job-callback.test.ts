/**
 * Integration tests — POST /api/internal/vault-gateway/cre-job-callback
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { buildApp } from "../../src/app.js";

const ENV_KEY = "INTERNAL_VAULT_JOB_CALLBACK_SECRET" as const;

describe("POST /api/internal/vault-gateway/cre-job-callback", () => {
  let prev: string | undefined;

  beforeEach(() => {
    prev = process.env[ENV_KEY];
  });

  afterEach(() => {
    if (prev === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = prev;
  });

  it("returns 503 when callback secret is not configured", async () => {
    delete process.env[ENV_KEY];
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/internal/vault-gateway/cre-job-callback",
      headers: { "content-type": "application/json" },
      payload: { jobId: "x", status: "completed" },
    });
    assert.equal(res.statusCode, 503);
    const body = res.json() as { error?: string };
    assert.equal(body.error, "CALLBACK_NOT_CONFIGURED");
  });

  it("returns 401 without valid X-Vault-Job-Secret", async () => {
    process.env[ENV_KEY] = "expected-secret-callback";
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/internal/vault-gateway/cre-job-callback",
      headers: {
        "content-type": "application/json",
        "x-vault-job-secret": "wrong",
      },
      payload: { jobId: "cre-job-fake", status: "completed" },
    });
    assert.equal(res.statusCode, 401);
  });

  it("returns 404 for unknown job id", async () => {
    process.env[ENV_KEY] = "expected-secret-callback";
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/internal/vault-gateway/cre-job-callback",
      headers: {
        "content-type": "application/json",
        "x-vault-job-secret": "expected-secret-callback",
      },
      payload: { jobId: "cre-job-does-not-exist-0000", status: "completed" },
    });
    assert.equal(res.statusCode, 404);
  });
});
