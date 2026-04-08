import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerVaultGatewayRoutes } from "./routes.js";

export async function registerVaultGatewayPlugin(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerVaultGatewayRoutes);
}
