import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";

export async function requestIdMiddleware(
  app: FastifyInstance
): Promise<void> {
  app.decorateRequest("requestId", "");
  app.addHook("onRequest", async (req: FastifyRequest, _reply: FastifyReply) => {
    (req as FastifyRequest & { requestId: string }).requestId =
      (req.headers["x-request-id"] as string) ?? randomUUID();
  });
}
