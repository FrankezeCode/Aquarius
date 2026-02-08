import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapArbitrumWhalesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Arbitrum whales not implemented" }));
}
