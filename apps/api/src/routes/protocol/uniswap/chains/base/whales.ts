import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapBaseWhalesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Base whales not implemented" }));
}
