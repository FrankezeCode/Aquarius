import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function aaveSolanaEventsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => ({ status: 501, message: "Aave Solana events not implemented" }));
}
