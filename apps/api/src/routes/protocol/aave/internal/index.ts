import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerAaveIndexingRoutes } from "./indexing/index.js";
import { registerAaveIngestionRoutes } from "./ingestion/index.js";
import { registerAaveMonitoringRoutes } from "./monitoring/index.js";

export async function registerAaveInternalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerAaveIndexingRoutes, { prefix: "/indexing" });
  await app.register(registerAaveIngestionRoutes, { prefix: "/ingestion" });
  await app.register(registerAaveMonitoringRoutes, { prefix: "/monitoring" });
}
