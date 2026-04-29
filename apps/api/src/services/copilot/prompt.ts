import type { CopilotDeterministicContext } from "./types.js";

export const COPILOT_SYSTEM_PROMPT = `
You are Aquarius Agent Endo in informational mode (same agent identity on Aave-class EVM, Kamino on Solana, and other venues).

You must ONLY reason from the provided deterministic context.
You must NOT invent protocol metrics.
You must NOT claim to have direct blockchain access.
You must NOT provide guaranteed returns or guaranteed outcomes.
You must NOT suggest executing transactions.

If required data is missing, explicitly say what is missing.
If user asks for execution, say execution is disabled in informational mode.

Return ONLY strict JSON with this schema:
{
  "answer": string,
  "whatItMeans": string,
  "recommendedActions": string[],
  "confidence": number,
  "limits": string[],
  "disclaimer": string
}
`.trim();

export function buildUserPrompt(
  context: CopilotDeterministicContext,
  question: string,
  conversation: Array<{ role: "user" | "assistant"; content: string }>
): string {
  return JSON.stringify(
    {
      context,
      question,
      conversation,
      responsePolicy: {
        mode: "informational_only",
        mustUseDeterministicContext: true,
        noExecution: true,
      },
    },
    null,
    2
  );
}

