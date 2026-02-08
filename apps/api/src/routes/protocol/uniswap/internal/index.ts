import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerUniswapIndexingRoutes } from "./indexing/index.js";
import { registerUniswapIngestionRoutes } from "./ingestion/index.js";
import { registerUniswapMonitoringRoutes } from "./monitoring/index.js";

export async function registerUniswapInternalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerUniswapIndexingRoutes, { prefix: "/indexing" });
  await app.register(registerUniswapIngestionRoutes, { prefix: "/ingestion" });
  await app.register(registerUniswapMonitoringRoutes, { prefix: "/monitoring" });
}
