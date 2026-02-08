import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { uniswapEthereumEventsRoutes } from "./events.js";
import { uniswapEthereumLiquidityRoutes } from "./liquidity.js";
import { uniswapEthereumWhalesRoutes } from "./whales.js";

export async function registerUniswapEthereumRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(uniswapEthereumEventsRoutes, { prefix: "/events" });
  await app.register(uniswapEthereumLiquidityRoutes, { prefix: "/liquidity" });
  await app.register(uniswapEthereumWhalesRoutes, { prefix: "/whales" });
}
