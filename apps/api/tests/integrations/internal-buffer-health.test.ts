/**
 * Integration — GET /api/internal/vault/buffer-health
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { resetCreOrchestrationAdapterForTests } from "../../src/infrastructure/orchestration/index.js";

describe("GET /api/internal/vault/buffer-health", () => {
  beforeEach(() => {
    resetCreOrchestrationAdapterForTests();
    process.env.BUFFER_MINIMUM_TVL_USD = "1000";
  });

  afterEach(() => {
    resetCreOrchestrationAdapterForTests();
    delete process.env.BUFFER_MINIMUM_TVL_USD;
  });

  it("returns internal disclosure and health fields", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/internal/vault/buffer-health",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as {
      disclosureKind?: string;
      notPublicSla?: boolean;
      alertLevel?: string;
      stress?: { solventAtHorizon?: boolean };
    };
    assert.equal(body.disclosureKind, "internal");
    assert.equal(body.notPublicSla, true);
    assert.ok(["ok", "warning", "critical"].includes(body.alertLevel ?? ""));
    assert.equal(typeof body.stress?.solventAtHorizon, "boolean");
  });

  it("accepts stress query params", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/internal/vault/buffer-health?stressDrawUsdPerHour=100&horizonHours=2",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { stress?: { stressDrawUsdPerHour?: number } };
    assert.equal(body.stress?.stressDrawUsdPerHour, 100);
  });

  it("returns watch suggestion when suggestForRiskLevel=watch", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/internal/vault/buffer-health?suggestForRiskLevel=watch",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { watchSuggestion?: { action?: string } };
    assert.equal(body.watchSuggestion?.action, "INCREASE_BUFFER");
  });
});
