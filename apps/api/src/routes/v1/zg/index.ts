import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerZgPipelineRoute } from "./pipeline.js";

export async function registerZgRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // Prefix /zg is applied by the parent register(); do not forward opts or routes become /zg/zg/...
  await app.register(registerZgPipelineRoute);
}
