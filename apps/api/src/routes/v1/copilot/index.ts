import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { createCopilotChatRoute } from "./chat.js";

export async function registerCopilotRoutes(
  app: FastifyInstance,
  opts: FastifyPluginOptions & { copilotRateLimitMax?: number } = {}
) {
  const { copilotRateLimitMax } = opts;
  await app.register(createCopilotChatRoute({ copilotRateLimitMax }));
}

