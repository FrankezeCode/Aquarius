import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
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

  // ── Public API /api/v1 (rate-limited in non-test) ───────────────────
  await app.register(
    async (scoped) => {
      if (config.rateLimitEnabled) {
        await scoped.register(rateLimit, {
          global: true,
          max: config.rateLimitPublicMax,
          timeWindow: "1 minute",
        });
      }
      await scoped.register(registerProtocolRoutes, { prefix: "/protocol" });
      await scoped.register(registerV1Routes, {
        copilotRateLimitMax: config.rateLimitCopilotMax,
      });
    },
    { prefix: "/api/v1" }
  );

  // ── Internal ingestion (CRE webhooks, etc.) ─────────────────────────
  await app.register(
    async (scoped) => {
      if (config.rateLimitEnabled) {
        await scoped.register(rateLimit, {
          global: true,
          max: config.rateLimitInternalWebhookMax,
          timeWindow: "1 minute",
        });
      }
      await scoped.register(registerInternalRoutes);
    },
    { prefix: "/api/internal" }
  );

  // ── CRE workflow HTTP surface ─────────────────────────────────────
  await app.register(
    async (scoped) => {
      if (config.rateLimitEnabled) {
        await scoped.register(rateLimit, {
          global: true,
          max: config.rateLimitCreMax,
          timeWindow: "1 minute",
        });
      }
      await scoped.register(registerCRERoutes);
    },
    { prefix: "/api/cre" }
  );

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
