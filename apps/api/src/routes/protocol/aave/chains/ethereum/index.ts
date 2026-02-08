import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { aaveEthereumEventsRoutes } from "./events.js";
import { aaveEthereumLiquidityRoutes } from "./liquidity.js";
import { aaveEthereumWhalesRoutes } from "./whales.js";

export async function registerAaveEthereumRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(aaveEthereumEventsRoutes, { prefix: "/events" });
  await app.register(aaveEthereumLiquidityRoutes, { prefix: "/liquidity" });
  await app.register(aaveEthereumWhalesRoutes, { prefix: "/whales" });
}
