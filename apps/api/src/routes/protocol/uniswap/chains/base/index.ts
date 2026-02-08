import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { uniswapBaseEventsRoutes } from "./events.js";
import { uniswapBaseLiquidityRoutes } from "./liquidity.js";
import { uniswapBaseWhalesRoutes } from "./whales.js";

export async function registerUniswapBaseRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(uniswapBaseEventsRoutes, { prefix: "/events" });
  await app.register(uniswapBaseLiquidityRoutes, { prefix: "/liquidity" });
  await app.register(uniswapBaseWhalesRoutes, { prefix: "/whales" });
}
