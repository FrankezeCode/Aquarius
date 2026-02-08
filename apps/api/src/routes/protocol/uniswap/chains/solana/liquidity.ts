import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapSolanaLiquidityRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Solana liquidity not implemented" }));
}
