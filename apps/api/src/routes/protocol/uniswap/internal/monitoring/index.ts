import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function registerUniswapMonitoringRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap monitoring not implemented" }));
}
