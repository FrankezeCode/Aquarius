import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapEthereumLiquidityRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Ethereum liquidity not implemented" }));
}
