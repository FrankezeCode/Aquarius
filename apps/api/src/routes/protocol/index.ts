import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerAaveRoutes } from "./aave/index.js";
import { registerUniswapRoutes } from "./uniswap/index.js";

export async function registerProtocolRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerAaveRoutes, { prefix: "/aave" });
  await app.register(registerUniswapRoutes, { prefix: "/uniswap" });
}
