import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapSolanaWhalesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Solana whales not implemented" }));
}
