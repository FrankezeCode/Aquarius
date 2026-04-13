/**
 * Kamino / Solana bounded context — health, snapshot, repay simulate (Phase D dry-run).
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../src/app.js";

describe("Kamino risk (kamino-solana domain)", () => {
  afterEach(() => {
    delete process.env.KAMINO_WRITE_ENABLED;
    delete process.env.KAMINO_ALLOWED_REPAY_MINTS;
    delete process.env.SOLANA_RPC_URL;
  });
  it("health returns domain kamino-solana and stub fields", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/kamino-risk/health",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as {
      status: string;
      service: string;
      domain: string;
      marketsDiscovered: number;
      copilotDomain: string;
      readPath: string;
      writePath: string;
      intelligenceVersion: string;
    };
    assert.equal(body.status, "ok");
    assert.equal(body.service, "kamino-risk");
    assert.equal(body.domain, "kamino-solana");
    assert.equal(body.marketsDiscovered, 0);
    assert.equal(body.copilotDomain, "kamino-solana");
    assert.equal(body.readPath, "disabled");
    assert.equal(body.writePath, "disabled");
    assert.equal(body.intelligenceVersion, "1");
  });

  it("snapshot returns 503 when live read disabled (test env)", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url:
        "/api/v1/kamino-risk/snapshot?wallet=11111111111111111111111111111112&market=So11111111111111111111111111111111111111112",
    });
    assert.equal(res.statusCode, 503);
    const body = res.json() as { error: { code: string } };
    assert.equal(body.error.code, "KAMINO_READ_DISABLED");
  });

  it("POST /repay/simulate returns 503 when write path disabled (test env)", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/kamino-risk/repay/simulate",
      payload: {
        wallet: "11111111111111111111111111111112",
        market: "So11111111111111111111111111111111111111112",
        repayMint: "So11111111111111111111111111111111111111112",
        amountUi: "0.01",
      },
    });
    assert.equal(res.statusCode, 503);
    const body = res.json() as { error: { code: string } };
    assert.equal(body.error.code, "WRITE_DISABLED");
  });

  it("POST /repay/simulate returns 400 on invalid body", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/kamino-risk/repay/simulate",
      payload: {
        wallet: "bad",
        market: "So11111111111111111111111111111111111111112",
        repayMint: "So11111111111111111111111111111111111111112",
        amountUi: "1",
      },
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { error: { code: string } };
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  it("POST /repay/simulate returns 403 when repay mint not allowlisted", async () => {
    process.env.KAMINO_WRITE_ENABLED = "true";
    process.env.SOLANA_RPC_URL = "https://api.devnet.solana.com";
    /** Allow only wrapped SOL mint; request repays USDC mint → policy rejects before RPC. */
    process.env.KAMINO_ALLOWED_REPAY_MINTS =
      "So11111111111111111111111111111111111111112";

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/kamino-risk/repay/simulate",
      payload: {
        wallet: "11111111111111111111111111111112",
        market: "So11111111111111111111111111111111111111112",
        repayMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amountUi: "0.01",
      },
    });
    assert.equal(res.statusCode, 403);
    const body = res.json() as { error: { code: string } };
    assert.equal(body.error.code, "MINT_NOT_ALLOWED");
  });

  it("POST /repay/simulate returns 503 when RPC not set but write forced on", async () => {
    process.env.KAMINO_WRITE_ENABLED = "true";
    // Intentionally no SOLANA_RPC_URL

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/kamino-risk/repay/simulate",
      payload: {
        wallet: "11111111111111111111111111111112",
        market: "So11111111111111111111111111111111111111112",
        repayMint: "So11111111111111111111111111111111111111112",
        amountUi: "0.01",
      },
    });
    assert.equal(res.statusCode, 503);
    const body = res.json() as { error: { code: string } };
    assert.equal(body.error.code, "RPC_NOT_CONFIGURED");
  });
});
