import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerAaveSignalRoutes } from "./signals/index.js";
import { registerAaveStreamRoutes } from "./streams/index.js";

export async function registerAavePublicRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerAaveSignalRoutes, { prefix: "/signals" });
  await app.register(registerAaveStreamRoutes, { prefix: "/streams" });
}
