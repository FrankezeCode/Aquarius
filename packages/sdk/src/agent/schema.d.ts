/**
 * Aquarius LLM Risk Agent — Zod Validation Schema
 *
 * Every LLM response is validated through this schema before
 * being accepted by the runtime. Invalid output triggers
 * safe-mode fallback (OBSERVE_ONLY).
 */
import { z } from "zod";
export declare const AgentDecisionSchema: z.ZodObject<{
    action: z.ZodEnum<{
        ESCALATE: "ESCALATE";
        OK: "OK";
        OBSERVE_ONLY: "OBSERVE_ONLY";
    }>;
    confidence: z.ZodNumber;
    reason: z.ZodString;
    severity_override: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        critical: "critical";
        low: "low";
        high: "high";
        medium: "medium";
    }>>>;
}, z.core.$strip>;
//# sourceMappingURL=schema.d.ts.map