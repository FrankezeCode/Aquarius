import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerUniswapArbitrumRoutes } from "./arbitrum/index.js";
import { registerUniswapBaseRoutes } from "./base/index.js";
import { registerUniswapEthereumRoutes } from "./ethereum/index.js";
import { registerUniswapSolanaRoutes } from "./solana/index.js";

export async function registerUniswapChainsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerUniswapArbitrumRoutes, { prefix: "/arbitrum" });
  await app.register(registerUniswapBaseRoutes, { prefix: "/base" });
  await app.register(registerUniswapEthereumRoutes, { prefix: "/ethereum" });
  await app.register(registerUniswapSolanaRoutes, { prefix: "/solana" });
}
