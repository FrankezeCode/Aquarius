import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapOracleAnomalySignalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap oracle anomaly signal not implemented" }));
}
