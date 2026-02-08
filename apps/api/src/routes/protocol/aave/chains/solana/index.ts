import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { aaveSolanaEventsRoutes } from "./events.js";
import { aaveSolanaLiquidityRoutes } from "./liquidity.js";
import { aaveSolanaWhalesRoutes } from "./whales.js";

export async function registerAaveSolanaRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(aaveSolanaEventsRoutes, { prefix: "/events" });
  await app.register(aaveSolanaLiquidityRoutes, { prefix: "/liquidity" });
  await app.register(aaveSolanaWhalesRoutes, { prefix: "/whales" });
}
