/**
 * Aquarius LLM Risk Agent — Decision Contract
 *
 * Strict enum of actions the agent may return.
 * Runtime enforces these; the LLM only informs.
 */
export type AgentAction = "OK" | "ESCALATE" | "OBSERVE_ONLY";
export interface AgentDecision {
    /** Chosen action based on risk snapshot analysis. */
    action: AgentAction;
    /** Model confidence in the decision (0–1). */
    confidence: number;
    /** Concise reasoning (<30 words). */
    reason: string;
    /** Optional severity override suggested by the agent. */
    severity_override?: "low" | "medium" | "high" | "critical" | null;
}
//# sourceMappingURL=types.d.ts.map