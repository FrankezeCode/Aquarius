import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function uniswapHfRiskSignalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Uniswap HF risk signal not implemented" }));
}
