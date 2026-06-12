/**
 * Integration tests — Arbitrum Aave risk + agent pack (mock provider).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../src/app.js";

describe("Aave risk — Arbitrum", () => {
  it("returns protocol health for arbitrum", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/aave-risk/protocol-health/arbitrum",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { protocol?: string; score?: number };
    assert.equal(body.protocol, "aave");
    assert.ok(typeof body.score === "number");
  });

  it("returns CRE workflow for /api/cre/run?chain=arbitrum", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/cre/run?chain=arbitrum",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { riskScore?: { composite?: number } };
    assert.ok(body.riskScore);
    assert.ok(typeof body.riskScore?.composite === "number");
  });

  it("returns agent pack for mock wallet on arbitrum", async () => {
    const app = await buildApp();
    const wallet = "0x0000000000000000000000000000000000000001";
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/aave-risk/arbitrum/agent-pack/${wallet}`,
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as {
      chain?: string;
      userRisk?: unknown;
      creWorkflow?: unknown;
    };
    assert.equal(body.chain, "arbitrum");
    assert.ok(body.userRisk);
    assert.ok(body.creWorkflow);
  });
});
