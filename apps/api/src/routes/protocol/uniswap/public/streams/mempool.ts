import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapMempoolStreamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap mempool stream not implemented" }));
}
