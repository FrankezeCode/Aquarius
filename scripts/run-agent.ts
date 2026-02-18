/**
 * Aquarius LLM Risk Agent — Demo Runner
 *
 * Application-layer script that loads .env and invokes the SDK agent.
 * The SDK itself remains environment-agnostic.
 *
 * Usage:
 *   pnpm tsx scripts/run-agent.ts
 */

import "dotenv/config";
import { AquariusLLMAgent } from "../packages/sdk/src/agent/llm-agent.js";

async function main() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in environment. Add it to .env");
  }

  const agent = new AquariusLLMAgent(apiKey);

  const scenarios = [
    {
      name: "Safe",
      snapshot: {
        protocol: "aave",
        chainId: 1,
        riskScore: 12,
        severity: "low",
        signals: {
          liquidationPressure: 0.05,
          collateralConcentration: 0.15,
          healthFactorTrend: 0.02,
          marketStressCorrelation: false,
        },
      },
    },
    {
      name: "Medium stress",
      snapshot: {
        protocol: "aave",
        chainId: 1,
        riskScore: 58,
        severity: "medium",
        signals: {
          liquidationPressure: 0.45,
          collateralConcentration: 0.52,
          healthFactorTrend: -0.08,
          marketStressCorrelation: false,
        },
      },
    },
    {
      name: "Critical risk",
      snapshot: {
        protocol: "aave",
        chainId: 1,
        riskScore: 82,
        severity: "high",
        signals: {
          liquidationPressure: 0.91,
          collateralConcentration: 0.78,
          healthFactorTrend: -0.22,
          marketStressCorrelation: true,
        },
      },
    },
  ];

  for (const { name, snapshot } of scenarios) {
    console.log(`\n── ${name} ──`);
    const decision = await agent.evaluate(snapshot);
    console.log(JSON.stringify(decision, null, 2));
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
