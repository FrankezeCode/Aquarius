import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aavePriceShocksStreamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave price shocks stream not implemented" }));
}
