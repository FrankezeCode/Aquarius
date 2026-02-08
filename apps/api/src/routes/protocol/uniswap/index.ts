import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerUniswapChainsRoutes } from "./chains/index.js";
import { registerUniswapInternalRoutes } from "./internal/index.js";
import { registerUniswapPublicRoutes } from "./public/index.js";

export async function registerUniswapRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerUniswapInternalRoutes, { prefix: "/internal" });
  await app.register(registerUniswapChainsRoutes, { prefix: "/chains" });
  await app.register(registerUniswapPublicRoutes, { prefix: "/public" });
}
