import { z } from "zod";

export const creWebhookBodySchema = z.object({
  workflowId: z.string().trim().min(1).max(256),
  timestamp: z.number().finite(),
  chainId: z.string().trim().min(1).max(100),
  data: z.record(z.string(), z.unknown()).default({}),
});

export type CREWebhookPayload = z.infer<typeof creWebhookBodySchema>;

export function parseCreWebhookBody(body: unknown) {
  return creWebhookBodySchema.safeParse(body);
}
