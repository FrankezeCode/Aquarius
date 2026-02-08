import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function registerUniswapIndexingRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap indexing not implemented" }));
}
