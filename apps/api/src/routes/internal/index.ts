/**
 * Internal Routes — Registration
 *
 * All internal/operational routes (not exposed to public consumers).
 * These routes handle CRE webhooks, ingestion pipelines, and admin operations.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerCREWebhookRoute } from "./ingest/cre-webhook.js";
import { registerDomainMetricsRoute } from "./metrics-domains.js";

export async function registerInternalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerCREWebhookRoute, { prefix: "/ingest/cre-webhook" });
  await app.register(registerDomainMetricsRoute, { prefix: "/metrics" });
}
