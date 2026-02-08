import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveSolanaWhalesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Solana whales not implemented" }));
}
