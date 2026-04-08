import type { ZgConfig } from "./config.js";
import { sha256Commitment } from "./commitment.js";
import { runOpenAiCompatibleInference } from "./inference.js";
import type { ZgPipelineBody } from "./schema.js";

const SYSTEM_PROMPT = `You are an advisory risk assistant for DeFi intelligence (Aquarius).
Respond with a short JSON object only, keys: label (string: one of watch|safe|elevated), rationale (string, max 2 sentences), confidence (number 0-1).
Do not give financial advice or guarantees; signals are informational only.`;

export type ZgPipelineResult = {
  mode: "mock" | "live";
  commitment: `0x${string}`;
  inference?: {
    model: string;
    text: string;
  };
  storageBridge?: {
    ok: boolean;
    status?: number;
  };
  /** Human-readable advisory line (non-binding). */
  advisoryLine: string;
};

async function optionalStorageBridge(
  cfg: ZgConfig,
  commitment: string,
  canonicalPayload: unknown
): Promise<ZgPipelineResult["storageBridge"]> {
  if (!cfg.storageBridgeUrl) return undefined;

  const res = await fetch(cfg.storageBridgeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commitment,
      payload: canonicalPayload,
      source: "aquarius-api",
    }),
  });

  return { ok: res.ok, status: res.status };
}

function buildUserPayload(body: ZgPipelineBody): string {
  return JSON.stringify(
    {
      protocol: body.protocol,
      chain: body.chain,
      contextRef: body.contextRef,
      riskSummary: body.riskSummary ?? {},
    },
    null,
    0
  );
}

function parseAdvisoryLine(inferenceText: string): string {
  try {
    const j = JSON.parse(inferenceText) as {
      label?: string;
      rationale?: string;
    };
    if (j.rationale && typeof j.rationale === "string") {
      return `[${j.label ?? "n/a"}] ${j.rationale}`;
    }
  } catch {
    /* fall through */
  }
  return inferenceText.slice(0, 500);
}

/**
 * API-led ZG-aligned pipeline: canonical commitment + optional inference + optional storage bridge.
 * Does not replace on-chain protocol truth; advisory only.
 */
export async function runZgPipeline(
  cfg: ZgConfig,
  body: ZgPipelineBody
): Promise<ZgPipelineResult> {
  const canonicalPayload = {
    v: 1,
    protocol: body.protocol,
    chain: body.chain,
    contextRef: body.contextRef,
    riskSummary: body.riskSummary ?? {},
    ts: new Date().toISOString(),
  };

  const commitment = sha256Commitment(canonicalPayload);

  if (cfg.mode === "mock") {
    return {
      mode: "mock",
      commitment,
      advisoryLine:
        "Mock pipeline: commitment computed server-side; set ZG_PIPELINE_MODE=live for inference.",
    };
  }

  if (!cfg.inferenceBaseUrl) {
    return {
      mode: "live",
      commitment,
      advisoryLine:
        "Live mode without inference URL: commitment only. Set ZG_INFERENCE_BASE_URL for model output.",
    };
  }

  const userPayload = buildUserPayload(body);
  const text = await runOpenAiCompatibleInference(
    cfg,
    SYSTEM_PROMPT,
    userPayload
  );

  const bridge = await optionalStorageBridge(cfg, commitment, canonicalPayload);

  return {
    mode: "live",
    commitment,
    inference: {
      model: cfg.inferenceModel,
      text,
    },
    storageBridge: bridge,
    advisoryLine: parseAdvisoryLine(text),
  };
}
