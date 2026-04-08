import { z } from "zod";

/**
 * Public pipeline input — no private keys or raw credentials.
 * riskSummary must not contain secrets (callers should aggregate/redact).
 */
export const zgPipelineBodySchema = z.object({
  protocol: z.string().trim().min(1).max(64),
  chain: z.string().trim().min(1).max(48),
  contextRef: z.string().trim().max(256).optional(),
  riskSummary: z.record(z.string(), z.unknown()).optional(),
});

export type ZgPipelineBody = z.infer<typeof zgPipelineBodySchema>;

export function parseZgPipelineBody(body: unknown) {
  return zgPipelineBodySchema.safeParse(body);
}
