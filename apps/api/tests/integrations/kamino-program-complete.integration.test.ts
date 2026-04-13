/**
 * Sequencing phases 1–6 — single smoke: public health + internal domain metrics.
 * (Read, CRE, write-path, and boundary scripts are covered by other tests.)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../src/app.js";

describe("Kamino program surface (phases 1–6 smoke)", () => {
  it("health + internal metrics expose kamino-solana", async () => {
    const app = await buildApp();

    const health = await app.inject({
      method: "GET",
      url: "/api/v1/kamino-risk/health",
    });
    assert.equal(health.statusCode, 200);
    const hb = health.json() as {
      service: string;
      domain: string;
      intelligenceVersion: string;
    };
    assert.equal(hb.service, "kamino-risk");
    assert.equal(hb.domain, "kamino-solana");
    assert.equal(hb.intelligenceVersion, "1");

    const metrics = await app.inject({
      method: "GET",
      url: "/api/internal/metrics/domains",
    });
    assert.equal(metrics.statusCode, 200);
    const mb = metrics.json() as {
      domains: { "kamino-solana": { domain: string; intelligenceVersion: string } };
    };
    assert.equal(mb.domains["kamino-solana"].domain, "kamino-solana");
    assert.equal(mb.domains["kamino-solana"].intelligenceVersion, "1");
  });
});
