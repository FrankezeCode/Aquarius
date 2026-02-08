import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapPriceShocksStreamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap price shocks stream not implemented" }));
}
