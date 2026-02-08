import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerAaveArbitrumRoutes } from "./arbitrum/index.js";
import { registerAaveBaseRoutes } from "./base/index.js";
import { registerAaveEthereumRoutes } from "./ethereum/index.js";
import { registerAaveSolanaRoutes } from "./solana/index.js";

export async function registerAaveChainsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerAaveArbitrumRoutes, { prefix: "/arbitrum" });
  await app.register(registerAaveBaseRoutes, { prefix: "/base" });
  await app.register(registerAaveEthereumRoutes, { prefix: "/ethereum" });
  await app.register(registerAaveSolanaRoutes, { prefix: "/solana" });
}
