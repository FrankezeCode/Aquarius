import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { aaveHfRiskSignalRoutes } from "./hf-risk.js";
import { aaveOracleAnomalySignalRoutes } from "./oracle-anomaly.js";

export async function registerAaveSignalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(aaveHfRiskSignalRoutes, { prefix: "/hf-risk" });
  await app.register(aaveOracleAnomalySignalRoutes, { prefix: "/oracle-anomaly" });
}
