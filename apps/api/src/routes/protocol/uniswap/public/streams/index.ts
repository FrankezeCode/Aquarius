import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { uniswapLiquidationsStreamRoutes } from "./liquidations.js";
import { uniswapMempoolStreamRoutes } from "./mempool.js";
import { uniswapPriceShocksStreamRoutes } from "./price-shocks.js";

export async function registerUniswapStreamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(uniswapLiquidationsStreamRoutes, { prefix: "/liquidations" });
  await app.register(uniswapMempoolStreamRoutes, { prefix: "/mempool" });
  await app.register(uniswapPriceShocksStreamRoutes, { prefix: "/price-shocks" });
}
