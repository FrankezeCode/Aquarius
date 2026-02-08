import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapArbitrumEventsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Arbitrum events not implemented" }));
}
