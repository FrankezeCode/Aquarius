/**
 * Aquarius LLM Risk Agent — Zod Validation Schema
 *
 * Every LLM response is validated through this schema before
 * being accepted by the runtime. Invalid output triggers
 * safe-mode fallback (OBSERVE_ONLY).
 */
import { z } from "zod";
export const AgentDecisionSchema = z.object({
    action: z.enum(["OK", "ESCALATE", "OBSERVE_ONLY"]),
    confidence: z.number().min(0).max(1),
    reason: z.string().max(200),
    severity_override: z
        .enum(["low", "medium", "high", "critical"])
        .nullable()
        .optional(),
});
//# sourceMappingURL=schema.js.map