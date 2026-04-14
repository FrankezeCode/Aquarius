/**
 * Internal Routes — Registration
 *
 * All internal/operational routes (not exposed to public consumers).
 * These routes handle CRE webhooks, ingestion pipelines, and admin operations.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerCREWebhookRoute } from "./ingest/cre-webhook.js";
import { registerVaultJobCallbackRoute } from "./ingest/vault-job-callback.js";
import { registerDomainMetricsRoute } from "./metrics-domains.js";
import { registerVaultBufferHealthRoute } from "./vault/buffer-health.js";

export async function registerInternalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerCREWebhookRoute, { prefix: "/ingest/cre-webhook" });
  await app.register(registerVaultJobCallbackRoute, {
    prefix: "/vault-gateway",
  });
  await app.register(registerVaultBufferHealthRoute, { prefix: "/vault" });
  await app.register(registerDomainMetricsRoute, { prefix: "/metrics" });
}
