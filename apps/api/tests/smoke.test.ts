import { describe, it } from "node:test";
import assert from "node:assert";
import { buildApp } from "../src/app.js";

describe("API smoke", () => {
  it("health returns ok", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json() as { status: string };
    assert.strictEqual(body.status, "ok");
  });

  it("protocol aave chains ethereum events returns not-implemented payload", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/protocol/aave/chains/ethereum/events",
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json() as { status: number };
    assert.strictEqual(body.status, 501);
  });

  it("protocol uniswap internal indexing returns not-implemented payload", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/protocol/uniswap/internal/indexing",
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json() as { status: number };
    assert.strictEqual(body.status, 501);
  });
});
