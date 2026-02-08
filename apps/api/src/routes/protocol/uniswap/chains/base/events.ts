import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapBaseEventsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap Base events not implemented" }));
}
