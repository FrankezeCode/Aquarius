import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function registerAaveMonitoringRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave monitoring not implemented" }));
}
