import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { uniswapHfRiskSignalRoutes } from "./hf-risk.js";
import { uniswapOracleAnomalySignalRoutes } from "./oracle-anomaly.js";

export async function registerUniswapSignalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(uniswapHfRiskSignalRoutes, { prefix: "/hf-risk" });
  await app.register(uniswapOracleAnomalySignalRoutes, { prefix: "/oracle-anomaly" });
}
