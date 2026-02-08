import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapSolanaEventsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Solana events not implemented" }));
}
