import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function registerAaveIndexingRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave indexing not implemented" }));
}
