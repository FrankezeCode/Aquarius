import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveBaseEventsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Base events not implemented" }));
}
