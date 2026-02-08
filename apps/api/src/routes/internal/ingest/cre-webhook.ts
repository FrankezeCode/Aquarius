/**
 * CRE Webhook — Internal Ingestion Endpoint
 *
 * Bounded context: CRE (Chainlink Runtime Environment)
 * This endpoint receives webhook payloads from CRE workflow triggers.
 *
 * Edge-runtime safe: no coupling to public API logic.
 * No heavy dependencies — parse, validate, forward.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export interface CREWebhookPayload {
  workflowId: string;
  timestamp: number;
  chainId: string;
  data: Record<string, unknown>;
}

export async function registerCREWebhookRoute(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.post<{ Body: CREWebhookPayload }>("/", async (request, reply) => {
    const payload = request.body;

    // Validate required fields
    if (!payload?.workflowId || !payload?.timestamp || !payload?.chainId) {
      return reply.status(400).send({
        error: "Invalid CRE webhook payload",
        required: ["workflowId", "timestamp", "chainId", "data"],
      });
    }

    // TODO: Forward to appropriate workflow handler based on workflowId
    // TODO: Add Zod schema validation per security rules

    return reply.status(202).send({
      status: "accepted",
      workflowId: payload.workflowId,
      timestamp: payload.timestamp,
    });
  });
}
