import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapEthereumWhalesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Ethereum whales not implemented" }));
}
