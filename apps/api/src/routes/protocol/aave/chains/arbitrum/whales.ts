import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveArbitrumWhalesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Arbitrum whales not implemented" }));
}
