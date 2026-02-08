import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveSolanaLiquidityRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Solana liquidity not implemented" }));
}
