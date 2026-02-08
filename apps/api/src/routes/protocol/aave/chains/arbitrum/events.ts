import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveArbitrumEventsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Arbitrum events not implemented" }));
}
