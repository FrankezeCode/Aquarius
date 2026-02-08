import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerAaveChainsRoutes } from "./chains/index.js";
import { registerAaveInternalRoutes } from "./internal/index.js";
import { registerAavePublicRoutes } from "./public/index.js";

export async function registerAaveRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerAaveInternalRoutes, { prefix: "/internal" });
  await app.register(registerAaveChainsRoutes, { prefix: "/chains" });
  await app.register(registerAavePublicRoutes, { prefix: "/public" });
}
