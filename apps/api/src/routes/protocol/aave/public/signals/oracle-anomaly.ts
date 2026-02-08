import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveOracleAnomalySignalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave oracle anomaly signal not implemented" }));
}
