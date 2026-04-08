/**
 * ZG (Zero Gravity / 0G-aligned) — server-side config (env only, no secrets in logs).
 *
 * Pipeline modes:
 * - off     — route returns 503 (feature disabled)
 * - mock    — commitment only, no external calls (CI / default dev)
 * - live    — optional OpenAI-compatible inference + optional storage bridge
 */

export type ZgPipelineMode = "off" | "mock" | "live";

function parseMode(raw: string | undefined): ZgPipelineMode {
  const v = raw?.trim().toLowerCase();
  if (v === "off" || v === "disabled" || v === "0" || v === "false") return "off";
  if (v === "live") return "live";
  return "mock";
}

export function loadZgConfig() {
  return {
    mode: parseMode(process.env.ZG_PIPELINE_MODE),
    inferenceBaseUrl: process.env.ZG_INFERENCE_BASE_URL?.trim() || undefined,
    inferenceApiKey: process.env.ZG_INFERENCE_API_KEY?.trim() || undefined,
    inferenceModel: process.env.ZG_INFERENCE_MODEL?.trim() || "gpt-4o-mini",
    /** Optional: POST canonical payload + commitment to your bridge (e.g. 0G Storage uploader). */
    storageBridgeUrl: process.env.ZG_STORAGE_BRIDGE_URL?.trim() || undefined,
    inferenceTimeoutMs: Math.min(
      120_000,
      Math.max(3_000, Number(process.env.ZG_INFERENCE_TIMEOUT_MS ?? 45_000) || 45_000)
    ),
  };
}

export type ZgConfig = ReturnType<typeof loadZgConfig>;
