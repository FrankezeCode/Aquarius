import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveLiquidationsStreamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave liquidations stream not implemented" }));
}
