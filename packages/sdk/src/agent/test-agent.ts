/**
 * Aquarius LLM Risk Agent — MVP Validation Script
 *
 * Run with:
 *   GROQ_API_KEY=<key> npx tsx packages/sdk/src/agent/test-agent.ts
 *
 * Tests three scenarios:
 *   1. Safe     → expect OK
 *   2. Medium   → expect OBSERVE_ONLY
 *   3. Critical → expect ESCALATE
 */

import { AquariusLLMAgent } from "./llm-agent.js";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("GROQ_API_KEY environment variable is required.");
  process.exit(1);
}

const agent = new AquariusLLMAgent(apiKey);

const scenarios = [
  {
    name: "Safe scenario",
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
    name: "Medium stress scenario",
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
    name: "Critical risk scenario",
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

async function run() {
  for (const { name, snapshot } of scenarios) {
    console.log(`\n── ${name} ──`);
    const decision = await agent.evaluate(snapshot);
    console.log(JSON.stringify(decision, null, 2));
  }
}

run().catch(console.error);
