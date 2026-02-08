/**
 * v1/lido — Versioned Route Placeholder
 *
 * Lido protocol routes will be wired here once the protocol module
 * is implemented. For now, returns 501 for all endpoints.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function registerLidoRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({
    status: 501,
    message: "Lido protocol routes not yet implemented",
  }));
}
