/**
 * Aquarius LLM Risk Agent — Groq (OpenAI-compatible) Implementation
 *
 * Deterministic risk adjudicator powered by Groq LLM.
 * Accepts any risk snapshot, returns Zod-validated AgentDecision.
 * On any failure (network, parse, validation) defaults to OBSERVE_ONLY.
 */

import OpenAI from "openai";
import type { AgentDecision } from "./types.js";
import { AgentDecisionSchema } from "./schema.js";
import { AQUARIUS_SYSTEM_PROMPT } from "./prompt.js";

const SAFE_FALLBACK: AgentDecision = {
  action: "OBSERVE_ONLY",
  confidence: 0.5,
  reason: "LLM output invalid, defaulting to safe mode",
  severity_override: null,
} as const;

export class AquariusLLMAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey || typeof apiKey !== "string") {
      throw new Error(
        "AquariusLLMAgent requires a valid API key. Ensure GROQ_API_KEY is set.",
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      timeout: 10_000,
    });
  }

  /**
   * Evaluate a risk snapshot and return a structured decision.
   *
   * @param snapshot - Any protocol risk snapshot (EvaluatableRisk or enriched).
   * @returns Validated AgentDecision, or safe fallback on failure.
   */
  async evaluate(snapshot: unknown): Promise<AgentDecision> {
    try {
      const response = await this.client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: AQUARIUS_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: JSON.stringify(snapshot),
          },
        ],
      });

      const text = response.choices[0].message.content ?? "";

      // Strip markdown fences if LLM wraps JSON in triple-backtick blocks.
      const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object found in LLM response");
      }

      const jsonString = cleaned.slice(firstBrace, lastBrace + 1);
      const parsed: unknown = JSON.parse(jsonString);
      return AgentDecisionSchema.parse(parsed);
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unknown LLM error";

      console.error("[LLM_AGENT_ERROR]", message);

      return SAFE_FALLBACK;
    }
  }
}

/** Backward-compatible alias — existing imports continue to work. */
export const AquariusGeminiAgent = AquariusLLMAgent;
