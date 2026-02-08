import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveHfRiskSignalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave HF risk signal not implemented" }));
}
