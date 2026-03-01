/**
 * Aquarius LLM Risk Agent — Groq (OpenAI-compatible) Implementation
 *
 * Deterministic risk adjudicator powered by Groq LLM.
 * Accepts any risk snapshot, returns Zod-validated AgentDecision.
 * On any failure (network, parse, validation) defaults to OBSERVE_ONLY.
 */
import type { AgentDecision } from "./types.js";
export declare class AquariusLLMAgent {
    private client;
    constructor(apiKey: string);
    /**
     * Evaluate a risk snapshot and return a structured decision.
     *
     * @param snapshot - Any protocol risk snapshot (EvaluatableRisk or enriched).
     * @returns Validated AgentDecision, or safe fallback on failure.
     */
    evaluate(snapshot: unknown): Promise<AgentDecision>;
}
/** Backward-compatible alias — existing imports continue to work. */
export declare const AquariusGeminiAgent: typeof AquariusLLMAgent;
//# sourceMappingURL=llm-agent.d.ts.map