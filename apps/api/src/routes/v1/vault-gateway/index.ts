import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { OrchestrationPort } from "../../../application/ports/orchestration.port.js";
import { registerVaultGatewayGetJob } from "./get-job.js";
import { registerVaultGatewayPostIntents } from "./post-intents.js";
import { registerVaultGatewayRoutes } from "./routes.js";

export interface VaultGatewayPluginOpts extends FastifyPluginOptions {
  vaultGatewayRateLimitMax?: number;
  orchestration?: OrchestrationPort;
}

export async function registerVaultGatewayPlugin(
  app: FastifyInstance,
  opts: VaultGatewayPluginOpts = {}
) {
  await app.register(registerVaultGatewayPostIntents, {
    vaultGatewayRateLimitMax: opts.vaultGatewayRateLimitMax,
    orchestration: opts.orchestration,
  });
  await app.register(registerVaultGatewayGetJob);
  await app.register(registerVaultGatewayRoutes);
}
