import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { uniswapSolanaEventsRoutes } from "./events.js";
import { uniswapSolanaLiquidityRoutes } from "./liquidity.js";
import { uniswapSolanaWhalesRoutes } from "./whales.js";

export async function registerUniswapSolanaRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(uniswapSolanaEventsRoutes, { prefix: "/events" });
  await app.register(uniswapSolanaLiquidityRoutes, { prefix: "/liquidity" });
  await app.register(uniswapSolanaWhalesRoutes, { prefix: "/whales" });
}
