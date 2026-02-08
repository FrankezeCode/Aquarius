import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { aaveBaseEventsRoutes } from "./events.js";
import { aaveBaseLiquidityRoutes } from "./liquidity.js";
import { aaveBaseWhalesRoutes } from "./whales.js";

export async function registerAaveBaseRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(aaveBaseEventsRoutes, { prefix: "/events" });
  await app.register(aaveBaseLiquidityRoutes, { prefix: "/liquidity" });
  await app.register(aaveBaseWhalesRoutes, { prefix: "/whales" });
}
