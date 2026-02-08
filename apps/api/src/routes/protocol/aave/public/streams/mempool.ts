import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveMempoolStreamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave mempool stream not implemented" }));
}
