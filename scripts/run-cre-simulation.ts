/**
 * Aquarius CRE — CLI Runner
 *
 * Thin wrapper around runCREWorkflow().
 * No duplicated logic. All orchestration lives in packages/domain/cre.
 *
 * Provider is resolved by factory based on DATA_PROVIDER_MODE env var.
 *
 * Usage:
 *   pnpm run:cre                              # uses mock (default)
 *   DATA_PROVIDER_MODE=tenderly pnpm run:cre  # uses Tenderly
 *   DATA_PROVIDER_MODE=onchain pnpm run:cre   # uses mainnet RPC
 */

import "dotenv/config";
import {
  runCREWorkflow,
  type CREWorkflowResult,
} from "../packages/domain/cre/run-cre-workflow.js";
import { createMarketDataProvider } from "../apps/api/src/adapters/providerFactory.js";

function printResult(result: CREWorkflowResult): void {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   Aquarius CRE Workflow — Live Pipeline      ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  const mode = process.env.DATA_PROVIDER_MODE ?? "mock";
  console.log(`[CRE] Data Provider: ${mode.toUpperCase()}`);
  console.log(`[CRE] Protocol Status: ${result.protocolStatus.toUpperCase()}`);
  console.log(
    `[CRE] Risk Intelligence: level=${result.riskScore.level} composite=${result.riskScore.composite}`
  );
  console.log(
    `[CRE] Agent Decision: ${result.agentDecision.decision} (confidence=${result.agentDecision.confidence}%)`
  );
  console.log(
    `[CRE] Actions: ${result.agentDecision.actionsRequested.length > 0 ? result.agentDecision.actionsRequested.join(", ") : "none (observe)"}`
  );
  console.log(
    `[CRE] Black Swan: ${result.agentDecision.blackSwanDetected}`
  );
  console.log();

  if (result.llmReasoning) {
    console.log(`[CRE] LLM action: ${result.llmReasoning.action}`);
    console.log(`[CRE] LLM confidence: ${result.llmReasoning.confidence}`);
    console.log(`[CRE] LLM reason: ${result.llmReasoning.reason}`);
    console.log(
      `[CRE] Latency (llm): ${result.latencies.llm} ms (async)`
    );
    console.log();
  } else {
    console.log("[CRE] LLM reasoning: unavailable (no GROQ_API_KEY)\n");
  }

  console.log(`[CRE] Latency (risk):   ${result.latencies.risk} ms`);
  console.log(`[CRE] Latency (agent):  ${result.latencies.agent} ms`);
  console.log(`[CRE] Latency (action): ${result.latencies.action} ms`);
  console.log(
    `[CRE] Total deterministic latency: ${result.latencies.risk + result.latencies.agent + result.latencies.action} ms`
  );
  console.log();

  console.log("━━━ Risk Factors ━━━");
  for (const f of result.riskFactors) {
    console.log(
      `  ${f.label}: ${f.value}${f.direction ? ` ${f.direction === "up" ? "↑" : f.direction === "down" ? "↓" : "→"}` : ""}`
    );
  }
  console.log();

  console.log("━━━ Events ━━━");
  for (const e of result.events) {
    console.log(`  [${e.timestamp}] ${e.message}`);
  }
  console.log();

  console.log("━━━ Pipeline Complete ━━━");
}

async function main() {
  const groqKey = process.env.GROQ_API_KEY;
  const provider = createMarketDataProvider();

  const result = await runCREWorkflow({
    provider,
    chainId: "ethereum",
    positionLimit: 50,
    enableLLM: !!groqKey,
    groqApiKey: groqKey,
  });

  printResult(result);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
