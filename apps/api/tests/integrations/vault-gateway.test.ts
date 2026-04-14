/**
 * Integration tests — GET /api/v1/vault-gateway/manifest and /routing
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../src/app.js";

describe("Vault gateway", () => {
  it("returns manifest with schemaVersion and chains", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/vault-gateway/manifest",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as {
      schemaVersion?: number;
      name?: string;
      layers?: unknown[];
      chains?: Array<{ id?: string }>;
    };
    assert.equal(body.schemaVersion, 1);
    assert.equal(body.name, "aquarius-vault-gateway");
    assert.equal(
      (body as { disclosureKind?: string }).disclosureKind,
      "advisory"
    );
    assert.ok(Array.isArray(body.layers) && body.layers.length > 0);
    assert.ok(
      body.chains?.some((c) => c.id === "ethereum"),
      "expected ethereum in chains"
    );
  });

  it("returns routing for ethereum USDC", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/vault-gateway/routing?chain=ethereum&asset=USDC",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as {
      chain?: string;
      asset?: string;
      sleeves?: unknown[];
      disclaimer?: string;
    };
    assert.equal(body.chain, "ethereum");
    assert.equal(body.asset, "USDC");
    assert.ok(Array.isArray(body.sleeves) && body.sleeves.length >= 2);
    assert.ok(typeof body.disclaimer === "string");
    assert.equal(
      (body as { disclosureKind?: string }).disclosureKind,
      "advisory"
    );
  });

  it("normalizes 0g alias to og_chain", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/vault-gateway/routing?chain=0g&asset=OG",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { chain?: string };
    assert.equal(body.chain, "og_chain");
  });

  it("returns 400 when query is invalid", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/vault-gateway/routing?chain=ethereum",
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { error?: string };
    assert.equal(body.error, "Invalid query");
  });

  it("returns 400 for unsupported chain", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/vault-gateway/routing?chain=unknownchain&asset=USDC",
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { error?: string };
    assert.equal(body.error, "Routing unavailable");
  });
});
