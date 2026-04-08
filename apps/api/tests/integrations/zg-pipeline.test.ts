/**
 * Integration tests — POST /api/v1/zg/pipeline
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../src/app.js";

describe("ZG pipeline POST /api/v1/zg/pipeline", () => {
  let prevMode: string | undefined;

  beforeEach(() => {
    prevMode = process.env.ZG_PIPELINE_MODE;
  });

  afterEach(() => {
    if (prevMode === undefined) {
      delete process.env.ZG_PIPELINE_MODE;
    } else {
      process.env.ZG_PIPELINE_MODE = prevMode;
    }
  });

  it("returns 400 for invalid body", async () => {
    process.env.ZG_PIPELINE_MODE = "mock";
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/zg/pipeline",
      payload: { protocol: "", chain: "ethereum" },
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { error?: string };
    assert.equal(body.error, "Invalid request");
  });

  it("returns 503 when ZG_PIPELINE_MODE=off", async () => {
    process.env.ZG_PIPELINE_MODE = "off";
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/zg/pipeline",
      payload: {
        protocol: "aave",
        chain: "ethereum",
        riskSummary: { score: 42 },
      },
    });
    assert.equal(res.statusCode, 503);
    const body = res.json() as { error?: string };
    assert.equal(body.error, "ZG_PIPELINE_DISABLED");
  });

  it("returns 200 with mock commitment for valid body", async () => {
    process.env.ZG_PIPELINE_MODE = "mock";
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/zg/pipeline",
      payload: {
        protocol: "aave",
        chain: "ethereum",
        contextRef: "test-ctx",
        riskSummary: { level: "watch" },
      },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as {
      mode?: string;
      commitment?: string;
      advisoryLine?: string;
    };
    assert.equal(body.mode, "mock");
    assert.ok(
      typeof body.commitment === "string" && body.commitment.startsWith("0x")
    );
    assert.equal(body.commitment!.length, 66);
    assert.ok(
      typeof body.advisoryLine === "string" && body.advisoryLine.length > 0
    );
  });
});
