import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Fastify from "fastify";
import { registerPublicErrorHandler } from "../../src/http/register-public-error-handler.js";
import { PublicHttpError } from "../../src/http/public-http-error.js";
import { requestIdMiddleware } from "../../src/middleware/requestId.js";

async function createApp() {
  const instance = Fastify({ logger: false });
  await requestIdMiddleware(instance);
  registerPublicErrorHandler(instance);

  instance.get("/boom500", async () => {
    throw new Error("SECRET_INTERNAL_DETAIL_SHOULD_NOT_LEAK");
  });

  instance.get("/boom400", async () => {
    throw Object.assign(new Error("bad"), { statusCode: 400 });
  });

  instance.get("/public", async () => {
    throw new PublicHttpError(422, "POLICY_REJECTED", "Amount exceeds cap.");
  });

  instance.get(
    "/validated",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["q"],
          properties: { q: { type: "string" } },
        },
      },
    },
    async () => ({ ok: true })
  );

  return instance;
}

describe("registerPublicErrorHandler", () => {
  it("500 responses omit stack and use INTERNAL_ERROR with generic message", async () => {
    const app = await createApp();
    try {
      const res = await app.inject({ method: "GET", url: "/boom500" });
      assert.equal(res.statusCode, 500);
      const body = JSON.parse(res.payload) as Record<string, unknown>;
      assert.equal(body.error, "INTERNAL_ERROR");
      assert.equal(body.message, "An unexpected error occurred.");
      assert.ok(!("stack" in body));
      assert.ok(
        !JSON.stringify(body).includes("SECRET_INTERNAL_DETAIL_SHOULD_NOT_LEAK")
      );
    } finally {
      await app.close();
    }
  });

  it("PublicHttpError preserves safe code and message", async () => {
    const app = await createApp();
    try {
      const res = await app.inject({ method: "GET", url: "/public" });
      assert.equal(res.statusCode, 422);
      const body = JSON.parse(res.payload) as Record<string, unknown>;
      assert.equal(body.error, "POLICY_REJECTED");
      assert.equal(body.message, "Amount exceeds cap.");
      assert.ok(!("stack" in body));
    } finally {
      await app.close();
    }
  });

  it("schema validation returns VALIDATION_ERROR without validation payload", async () => {
    const app = await createApp();
    try {
      const res = await app.inject({ method: "GET", url: "/validated" });
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.payload) as Record<string, unknown>;
      assert.equal(body.error, "VALIDATION_ERROR");
      assert.equal(body.message, "Request validation failed.");
      assert.ok(!("validation" in body));
      assert.ok(!("stack" in body));
    } finally {
      await app.close();
    }
  });

  it("generic 4xx does not leak Error.message", async () => {
    const app = await createApp();
    try {
      const res = await app.inject({ method: "GET", url: "/boom400" });
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.payload) as Record<string, unknown>;
      assert.ok(!JSON.stringify(body).includes("bad"));
    } finally {
      await app.close();
    }
  });

  it("unknown path returns NOT_FOUND without stack", async () => {
    const app = await createApp();
    try {
      const res = await app.inject({ method: "GET", url: "/no-such-path-phase8" });
      assert.equal(res.statusCode, 404);
      const body = JSON.parse(res.payload) as Record<string, unknown>;
      assert.equal(body.error, "NOT_FOUND");
      assert.ok(!("stack" in body));
    } finally {
      await app.close();
    }
  });
});
