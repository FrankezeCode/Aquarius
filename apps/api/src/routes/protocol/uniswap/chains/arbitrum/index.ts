import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { uniswapArbitrumEventsRoutes } from "./events.js";
import { uniswapArbitrumLiquidityRoutes } from "./liquidity.js";
import { uniswapArbitrumWhalesRoutes } from "./whales.js";

export async function registerUniswapArbitrumRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(uniswapArbitrumEventsRoutes, { prefix: "/events" });
  await app.register(uniswapArbitrumLiquidityRoutes, { prefix: "/liquidity" });
  await app.register(uniswapArbitrumWhalesRoutes, { prefix: "/whales" });
}
