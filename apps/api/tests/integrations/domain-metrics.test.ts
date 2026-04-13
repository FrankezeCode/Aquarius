/**
 * Internal domain metrics snapshot (kamino-solana).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../src/app.js";

describe("GET /api/internal/metrics/domains", () => {
  it("returns kamino-solana RPC stats and intelligence version", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/internal/metrics/domains",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as {
      domains: {
        "kamino-solana": {
          domain: string;
          intelligenceVersion: string;
          rpcLatencyMs: { p50: number; p95: number; sampleCount: number };
          rpcErrorRate: number;
        };
      };
    };
    assert.equal(body.domains["kamino-solana"].domain, "kamino-solana");
    assert.equal(body.domains["kamino-solana"].intelligenceVersion, "1");
    assert.equal(typeof body.domains["kamino-solana"].rpcErrorRate, "number");
  });
});
