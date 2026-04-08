import type { ZgConfig } from "./config.js";

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

/**
 * OpenAI-compatible chat completions (used by many providers including 0G-style endpoints).
 */
export async function runOpenAiCompatibleInference(
  cfg: ZgConfig,
  systemPrompt: string,
  userPayload: string
): Promise<string> {
  const base = cfg.inferenceBaseUrl?.replace(/\/$/, "");
  if (!base) {
    throw new Error("ZG_INFERENCE_BASE_URL is not set");
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), cfg.inferenceTimeoutMs);

  try {
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.inferenceApiKey
          ? { Authorization: `Bearer ${cfg.inferenceApiKey}` }
          : {}),
      },
      body: JSON.stringify({
        model: cfg.inferenceModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload },
        ],
        max_tokens: 320,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`inference HTTP ${res.status}`);
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("inference returned empty content");
    }
    return text;
  } finally {
    clearTimeout(t);
  }
}
