import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function registerUniswapIngestionRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap ingestion not implemented" }));
}
