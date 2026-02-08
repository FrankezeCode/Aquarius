import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapLiquidationsStreamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap liquidations stream not implemented" }));
}
