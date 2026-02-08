import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapBaseLiquidityRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Base liquidity not implemented" }));
}
