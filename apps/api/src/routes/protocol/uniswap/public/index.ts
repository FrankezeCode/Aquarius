import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerUniswapSignalRoutes } from "./signals/index.js";
import { registerUniswapStreamRoutes } from "./streams/index.js";

export async function registerUniswapPublicRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerUniswapSignalRoutes, { prefix: "/signals" });
  await app.register(registerUniswapStreamRoutes, { prefix: "/streams" });
}
