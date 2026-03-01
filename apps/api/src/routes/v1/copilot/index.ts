import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { createCopilotChatRoute } from "./chat.js";

export async function registerCopilotRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(createCopilotChatRoute());
}

