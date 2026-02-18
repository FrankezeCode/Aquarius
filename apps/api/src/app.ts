import Fastify from "fastify";
import { loadConfig } from "./config/index.js";
import { registerCors } from "./middleware/cors.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { registerProtocolRoutes } from "./routes/protocol/index.js";
import { registerV1Routes } from "./routes/v1/index.js";
import { registerInternalRoutes } from "./routes/internal/index.js";
import { registerCRERoutes } from "./routes/cre/index.js";

export async function buildApp() {
  const config = loadConfig();
  const app = Fastify({ logger: config.nodeEnv !== "test" });

  await requestIdMiddleware(app);
  await registerCors(app);

  // ── Existing protocol routes (preserved for backward compatibility) ──
  await app.register(registerProtocolRoutes, { prefix: "/api/v1/protocol" });

  // ── New DDD-aligned route layers ─────────────────────────────────────
  // v1 routes: public API versioned under /api/v1/{protocol}
  await app.register(registerV1Routes, { prefix: "/api/v1" });

  // Internal routes: CRE webhooks, ingestion pipelines (not public)
  await app.register(registerInternalRoutes, { prefix: "/api/internal" });

  // CRE workflow execution endpoint
  await app.register(registerCRERoutes, { prefix: "/api/cre" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
