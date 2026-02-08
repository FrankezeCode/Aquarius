import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { aaveArbitrumEventsRoutes } from "./events.js";
import { aaveArbitrumLiquidityRoutes } from "./liquidity.js";
import { aaveArbitrumWhalesRoutes } from "./whales.js";

export async function registerAaveArbitrumRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(aaveArbitrumEventsRoutes, { prefix: "/events" });
  await app.register(aaveArbitrumLiquidityRoutes, { prefix: "/liquidity" });
  await app.register(aaveArbitrumWhalesRoutes, { prefix: "/whales" });
}
