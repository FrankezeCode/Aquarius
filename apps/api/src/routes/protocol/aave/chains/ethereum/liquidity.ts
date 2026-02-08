import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveEthereumLiquidityRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Ethereum liquidity not implemented" }));
}
