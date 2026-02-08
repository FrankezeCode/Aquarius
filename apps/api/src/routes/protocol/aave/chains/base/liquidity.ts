import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveBaseLiquidityRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Base liquidity not implemented" }));
}
