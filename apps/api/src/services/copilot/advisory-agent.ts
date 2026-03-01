import {
  parseCopilotAdvisoryResponse,
} from "./schema.js";
import { buildUserPrompt, COPILOT_SYSTEM_PROMPT } from "./prompt.js";
import type {
  CopilotAdvisoryResponse,
  CopilotDeterministicContext,
  CopilotConversationTurn,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 7_500;
const MODEL = "llama-3.3-70b-versatile";

function fallbackResponse(
  context: CopilotDeterministicContext,
  reason: string
): CopilotAdvisoryResponse {
  const isHighRisk =
    context.userRisk?.category === "high_risk" ||
    context.protocolHealth?.category === "high_risk";

  return {
    mode: "informational",
    answer: isHighRisk
      ? "Risk appears elevated. Use the deterministic health and user-risk metrics on screen as your source of truth."
      : "Your deterministic risk context is available and can guide next actions without chat interpretation.",
    whatItMeans:
      "The advisory model is unavailable right now, so this response is deterministic fallback guidance only.",
    recommendedActions: isHighRisk
      ? [
          "Prioritize liquidation buffer protection based on current health factor and liquidation distance.",
          "Use stress-test and projected-HF endpoints before changing leverage.",
        ]
      : [
          "Continue monitoring health factor direction and liquidation distance.",
          "Use stress-test endpoints to evaluate downside scenarios before increasing risk.",
        ],
    confidence: 0.55,
    limits: [
      "Fallback mode: no model interpretation available for this request.",
      `Reason: ${reason}`,
    ],
    disclaimer:
      "Informational guidance only. Not financial advice. No execution is performed in this mode.",
    contextTimestamp: context.contextTimestamp,
    schemaVersion: "v1",
    toolRouter: {
      available: false,
      mode: "disabled_option_a",
    },
    intentEnvelope: {
      available: false,
      mode: "disabled_option_a",
    },
    fallbackUsed: true,
  };
}

async function callGroqLLM(input: {
  apiKey: string;
  userPrompt: string;
  timeoutMs: number;
}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: COPILOT_SYSTEM_PROMPT },
          { role: "user", content: input.userPrompt },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Groq request failed (${res.status})`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("LLM output did not contain a JSON object.");
    }
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } finally {
    clearTimeout(timeout);
  }
}

export class CopilotAdvisoryAgent {
  async advise(input: {
    context: CopilotDeterministicContext;
    question: string;
    conversation: CopilotConversationTurn[];
  }): Promise<CopilotAdvisoryResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return fallbackResponse(input.context, "GROQ_API_KEY not configured");
    }

    try {
      const parsed = parseCopilotAdvisoryResponse(
        await callGroqLLM({
          apiKey,
          userPrompt: buildUserPrompt(
            input.context,
            input.question,
            input.conversation
          ),
          timeoutMs: DEFAULT_TIMEOUT_MS,
        })
      );

      return {
        mode: "informational",
        ...parsed,
        contextTimestamp: input.context.contextTimestamp,
        schemaVersion: "v1",
        toolRouter: {
          available: false,
          mode: "disabled_option_a",
        },
        intentEnvelope: {
          available: false,
          mode: "disabled_option_a",
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return fallbackResponse(input.context, message);
    }
  }
}

