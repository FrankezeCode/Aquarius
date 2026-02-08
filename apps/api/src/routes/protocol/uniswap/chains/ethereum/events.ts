import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapEthereumEventsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Ethereum events not implemented" }));
}
