import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { aaveLiquidationsStreamRoutes } from "./liquidations.js";
import { aaveMempoolStreamRoutes } from "./mempool.js";
import { aavePriceShocksStreamRoutes } from "./price-shocks.js";

export async function registerAaveStreamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(aaveLiquidationsStreamRoutes, { prefix: "/liquidations" });
  await app.register(aaveMempoolStreamRoutes, { prefix: "/mempool" });
  await app.register(aavePriceShocksStreamRoutes, { prefix: "/price-shocks" });
}
