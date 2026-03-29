/**
 * Integration Test — CRE Webhook → Risk Intelligence Pipeline
 *
 * Covers:
 *   - Valid aave-risk payload → 200 with normalized MonitorSnapshot result
 *   - Response includes globalRiskIndex, liquidationPressure, timestamp
 *   - Invalid payload → 400
 *   - Unknown workflowId → 202 accepted
 *   - Performance: end-to-end webhook → response time
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../../src/app.js";

// ── Helpers ──────────────────────────────────────────────────────────

async function postWebhook(
  app: Awaited<ReturnType<typeof buildApp>>,
  body: Record<string, unknown>
) {
  return app.inject({
    method: "POST",
    url: "/api/internal/ingest/cre-webhook",
    payload: body,
  });
}

// ── Tests ────────────────────────────────────────────────────────────

describe("CRE Webhook / aave-risk integration", () => {
  it("processes aave-risk workflow and returns normalized snapshot", async () => {
    const app = await buildApp();
    const res = await postWebhook(app, {
      workflowId: "aave-risk",
      timestamp: Date.now(),
      chainId: "ethereum",
      data: {},
    });

    assert.equal(res.statusCode, 200);
    const body = res.json() as Record<string, unknown>;
    assert.equal(body.status, "processed");
    assert.equal(body.workflowId, "aave-risk");
    assert.equal(body.chainId, "ethereum");
    assert.equal(typeof body.globalRiskIndex, "number");
    assert.ok(
      (body.globalRiskIndex as number) >= 0 &&
        (body.globalRiskIndex as number) <= 100,
      `globalRiskIndex should be 0..100, got ${body.globalRiskIndex}`
    );
    assert.equal(typeof body.liquidationPressure, "number");
    assert.ok(
      (body.liquidationPressure as number) >= 0 &&
        (body.liquidationPressure as number) <= 100,
      `liquidationPressure should be 0..100, got ${body.liquidationPressure}`
    );
    assert.equal(typeof body.timestamp, "string");
    assert.ok(
      (body.timestamp as string) !== "system-not-ready",
      "timestamp should be a real ISO timestamp, not system-not-ready"
    );
  });

  it("also accepts aave-risk-monitor workflowId", async () => {
    const app = await buildApp();
    const res = await postWebhook(app, {
      workflowId: "aave-risk-monitor",
      timestamp: Date.now(),
      chainId: "arbitrum",
      data: {},
    });

    assert.equal(res.statusCode, 200);
    const body = res.json() as Record<string, unknown>;
    assert.equal(body.status, "processed");
    assert.equal(body.chainId, "arbitrum");
  });

  it("processes confidential-http workflow with correlation metadata", async () => {
    const app = await buildApp();
    const correlationId = `corr-${Date.now()}`;
    const res = await postWebhook(app, {
      workflowId: "aave-risk-confidential-http",
      timestamp: Date.now(),
      chainId: "ethereum",
      data: {
        confidential: true,
        source: "confidential-http",
        correlationId,
      },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json() as Record<string, unknown>;
    assert.equal(body.status, "processed");
    assert.equal(body.ingestionMode, "confidential-http");
    assert.equal(body.correlationId, correlationId);
  });

  it("rejects stale confidential callbacks in local_don_ccc mode", async () => {
    const previousMode = process.env.EXECUTION_MODE;
    const previousMaxAge = process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS;

    process.env.EXECUTION_MODE = "local_don_ccc";
    process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS = "1000";

    try {
      const app = await buildApp();
      const res = await postWebhook(app, {
        workflowId: "aave-risk-confidential-http",
        timestamp: Date.now() - 10_000,
        chainId: "ethereum",
        data: {
          confidential: true,
          source: "confidential-http",
          correlationId: `stale-${Date.now()}`,
        },
      });

      assert.equal(res.statusCode, 409);
      const body = res.json() as Record<string, unknown>;
      assert.equal(body.error, "Stale confidential callback rejected");
      assert.equal(body.executionMode, "local_don_ccc");
    } finally {
      process.env.EXECUTION_MODE = previousMode;
      process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS = previousMaxAge;
    }
  });

  it("returns 400 for missing required fields", async () => {
    const app = await buildApp();

    // Missing workflowId
    const r1 = await postWebhook(app, {
      timestamp: Date.now(),
      chainId: "ethereum",
      data: {},
    });
    assert.equal(r1.statusCode, 400);

    // Missing chainId
    const r2 = await postWebhook(app, {
      workflowId: "aave-risk",
      timestamp: Date.now(),
      data: {},
    });
    assert.equal(r2.statusCode, 400);

    // Missing timestamp
    const r3 = await postWebhook(app, {
      workflowId: "aave-risk",
      chainId: "ethereum",
      data: {},
    });
    assert.equal(r3.statusCode, 400);
  });

  it("returns 400 when data is not a record", async () => {
    const app = await buildApp();
    const res = await postWebhook(app, {
      workflowId: "aave-risk",
      timestamp: Date.now(),
      chainId: "ethereum",
      data: [] as unknown as Record<string, unknown>,
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { error?: string };
    assert.equal(body.error, "Invalid CRE webhook payload");
  });

  it("returns 400 for non-finite timestamp", async () => {
    const app = await buildApp();
    const res = await postWebhook(app, {
      workflowId: "aave-risk",
      timestamp: Number.NaN,
      chainId: "ethereum",
      data: {},
    });
    assert.equal(res.statusCode, 400);
  });

  it("returns 400 when workflowId exceeds max length", async () => {
    const app = await buildApp();
    const res = await postWebhook(app, {
      workflowId: "x".repeat(257),
      timestamp: Date.now(),
      chainId: "ethereum",
      data: {},
    });
    assert.equal(res.statusCode, 400);
  });

  it("accepts payload with omitted data (defaults to empty object)", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/internal/ingest/cre-webhook",
      payload: {
        workflowId: "aave-risk",
        timestamp: Date.now(),
        chainId: "ethereum",
      },
    });
    assert.equal(res.statusCode, 200);
  });

  it("returns 202 for unknown workflow IDs", async () => {
    const app = await buildApp();
    const res = await postWebhook(app, {
      workflowId: "unknown-workflow",
      timestamp: Date.now(),
      chainId: "ethereum",
      data: {},
    });

    assert.equal(res.statusCode, 202);
    const body = res.json() as Record<string, unknown>;
    assert.equal(body.status, "accepted");
  });

  it("multiple runs return consistent normalized shape", async () => {
    const app = await buildApp();

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        postWebhook(app, {
          workflowId: "aave-risk",
          timestamp: Date.now(),
          chainId: "ethereum",
          data: {},
        })
      )
    );

    for (const res of results) {
      assert.equal(res.statusCode, 200);
      const body = res.json() as Record<string, unknown>;
      assert.equal(body.status, "processed");
      assert.equal(typeof body.globalRiskIndex, "number");
      assert.equal(typeof body.liquidationPressure, "number");
      assert.equal(typeof body.timestamp, "string");
    }
  });
});

// ── Performance ──────────────────────────────────────────────────────

describe("CRE Webhook / performance", () => {
  it("end-to-end webhook → response in < 150ms", async () => {
    const app = await buildApp();
    const start = performance.now();
    await postWebhook(app, {
      workflowId: "aave-risk",
      timestamp: Date.now(),
      chainId: "ethereum",
      data: {},
    });
    const elapsed = performance.now() - start;
    assert.ok(
      elapsed < 150,
      `E2E webhook should complete in < 150ms, took ${elapsed.toFixed(1)}ms`
    );
  });
});
