import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveArbitrumLiquidityRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Arbitrum liquidity not implemented" }));
}
