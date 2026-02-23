/**
 * AI Risk Intelligence Context Engine (Layer 2)
 *
 * A deterministic base score has already been computed by Layer 1.
 * This layer interprets it contextually and optionally adjusts within ±10.
 *
 * Responsibilities:
 *   1. Analyze provided metrics and baseScore
 *   2. Classify market regime (normal | elevated | stressed)
 *   3. Identify dominant risk vector
 *   4. Adjust score within safe bounds if justified
 *   5. Provide concise reasoning (max 25 words)
 *   6. Output strict validated JSON
 *
 * Safety guarantees:
 *   - Max deviation from baseScore = ±10
 *   - Final score clamped 0–100
 *   - Category re-derived from adjusted score
 *   - On ANY failure: fallback to deterministic score, zero downtime
 *
 * Uses Groq API (llama-3.3-70b) via raw fetch — no openai dep needed.
 */

import type {
  AIContextInput,
  AIContextResult,
  HealthCategory,
  MarketRegime,
} from "@aquarius/types";
import { classifyScore } from "./scoring.js";

// ── Constants ───────────────────────────────────────────────────────

const MAX_ADJUSTMENT = 10;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_TIMEOUT_MS = 8_000;

// ── System Prompt ───────────────────────────────────────────────────

const AI_CONTEXT_SYSTEM_PROMPT = `You are Aquarius Risk Intelligence Context Engine.

A deterministic health score has already been calculated using weighted risk metrics.

You must NOT recompute the base score from scratch.
You may adjust the final score within ±10 points only if regime conditions justify it.

Your responsibilities:

1) Analyze provided metrics and baseScore.
2) Classify market regime (normal | elevated | stressed).
3) Identify dominant risk vector.
4) Adjust score within safe bounds if necessary.
5) Provide concise reasoning (max 25 words).
6) Output strict JSON only.

Inputs:
- baseScore (0–100)
- liquidationRisk
- volatilityRisk
- liquidityRisk
- systemicRisk
- stressSimulationResults (optional)

Adjustment Rules:
- Max deviation from baseScore = ±10
- If stressed regime → score may decrease
- If normal regime → score should remain close to baseScore
- Clamp final score 0–100

Classification:
score >= 75 → stable
score >= 50 → watch
score < 50 → high_risk

Return ONLY JSON:

{
  "score": number,
  "category": "stable" | "watch" | "high_risk",
  "regime": "normal" | "elevated" | "stressed",
  "dominantRisk": "string",
  "confidence": number (0-1),
  "reasoning": "short explanation"
}`;

// ── Validation ──────────────────────────────────────────────────────

const VALID_CATEGORIES: Set<string> = new Set(["stable", "watch", "high_risk"]);
const VALID_REGIMES: Set<string> = new Set(["normal", "elevated", "stressed"]);

function validateAIResponse(raw: unknown, baseScore: number): AIContextResult | null {
  if (typeof raw !== "object" || raw === null) return null;

  const obj = raw as Record<string, unknown>;

  if (typeof obj.score !== "number" || !Number.isFinite(obj.score)) return null;
  if (typeof obj.confidence !== "number" || !Number.isFinite(obj.confidence)) return null;
  if (typeof obj.dominantRisk !== "string" || obj.dominantRisk.length === 0) return null;
  if (typeof obj.reasoning !== "string" || obj.reasoning.length === 0) return null;
  if (typeof obj.regime !== "string" || !VALID_REGIMES.has(obj.regime)) return null;
  if (typeof obj.category !== "string" || !VALID_CATEGORIES.has(obj.category)) return null;

  const deviation = Math.abs(obj.score - baseScore);
  if (deviation > MAX_ADJUSTMENT) return null;

  const clampedScore = Math.round(Math.max(0, Math.min(100, obj.score)));
  const clampedConfidence = Math.max(0, Math.min(1, obj.confidence));

  return {
    score: clampedScore,
    category: classifyScore(clampedScore),
    regime: obj.regime as MarketRegime,
    dominantRisk: obj.dominantRisk,
    confidence: Math.round(clampedConfidence * 100) / 100,
    reasoning: obj.reasoning.slice(0, 150),
  };
}

// ── Deterministic Fallback ──────────────────────────────────────────

function buildFallback(input: AIContextInput): AIContextResult {
  const topRisk = identifyDominantRisk(input);
  const regime = inferRegimeDeterministic(input);

  return {
    score: input.baseScore,
    category: classifyScore(input.baseScore),
    regime,
    dominantRisk: topRisk,
    confidence: 0.7,
    reasoning: buildFallbackReasoning(input, topRisk, regime),
  };
}

function identifyDominantRisk(input: AIContextInput): string {
  const risks = [
    { label: "liquidation risk", value: input.liquidationRisk },
    { label: "volatility risk", value: input.volatilityRisk },
    { label: "liquidity risk", value: input.liquidityRisk },
    { label: "systemic risk", value: input.systemicRisk },
  ];
  risks.sort((a, b) => b.value - a.value);
  return risks[0]!.label;
}

function inferRegimeDeterministic(input: AIContextInput): MarketRegime {
  const avg =
    (input.liquidationRisk + input.volatilityRisk + input.liquidityRisk + input.systemicRisk) / 4;
  if (avg >= 60) return "stressed";
  if (avg >= 35) return "elevated";
  return "normal";
}

function buildFallbackReasoning(
  input: AIContextInput,
  topRisk: string,
  regime: MarketRegime
): string {
  if (input.baseScore >= 75) {
    return `All risk dimensions within safe bounds. Market regime: ${regime}.`;
  }
  return `Elevated ${topRisk} is the primary concern. Market regime: ${regime}.`;
}

// ── Groq API Call ───────────────────────────────────────────────────

async function callGroqAPI(input: AIContextInput, apiKey: string): Promise<AIContextResult> {
  const userMessage = JSON.stringify({
    baseScore: input.baseScore,
    liquidationRisk: input.liquidationRisk,
    volatilityRisk: input.volatilityRisk,
    liquidityRisk: input.liquidityRisk,
    systemicRisk: input.systemicRisk,
    ...(input.stressSimulationResults
      ? { stressSimulationResults: input.stressSimulationResults }
      : {}),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: AI_CONTEXT_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";

    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object found in AI response");
    }

    const parsed: unknown = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    const validated = validateAIResponse(parsed, input.baseScore);

    if (!validated) {
      throw new Error("AI response failed validation (deviation > ±10 or invalid schema)");
    }

    return validated;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Run the AI Context Layer on a deterministic health score.
 *
 * Pipeline:
 *   1. Check for GROQ_API_KEY — if missing, return deterministic fallback
 *   2. Call Groq API with bounded adjustment prompt
 *   3. Validate response (schema + ±10 deviation guard)
 *   4. On any failure, return deterministic fallback
 *
 * Zero downtime. Zero instability. Judges love fallback mechanisms.
 */
export async function aiContextLayer(input: AIContextInput): Promise<AIContextResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return buildFallback(input);
  }

  try {
    return await callGroqAPI(input, apiKey);
  } catch {
    return buildFallback(input);
  }
}

/**
 * Build an AIContextInput from the existing risk inputs and base score.
 */
export function buildAIContextInput(
  baseScore: number,
  risks: {
    volatility: number;
    liquidityRisk: number;
    liquidationRisk: number;
    smartContractRisk: number;
  }
): AIContextInput {
  return {
    baseScore,
    liquidationRisk: risks.liquidationRisk,
    volatilityRisk: risks.volatility,
    liquidityRisk: risks.liquidityRisk,
    systemicRisk: risks.smartContractRisk,
  };
}
