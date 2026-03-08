/**
 * Aave Risk Workflow — Entry Point
 *
 * Orchestrates the Aave risk monitoring pipeline:
 * 1. Fetch on-chain data (pool states, oracle prices)
 * 2. Compute risk signals (health factor distribution, liquidation proximity)
 * 3. Emit signals to downstream consumers
 *
 * This file is the execution entry point referenced by workflow.yaml.
 */

import { workflowRunId } from "../shared/utils.js";
import { type WorkflowStatus } from "../shared/constants.js";
import { cre, Runner } from "@chainlink/cre-sdk";

export interface AaveRiskWorkflowResult {
  runId: string;
  status: WorkflowStatus;
  signals: number;
  durationMs: number;
}

/**
 * Execute the Aave risk workflow.
 * TODO: Wire real on-chain data fetching and signal computation.
 */
export async function executeAaveRiskWorkflow(): Promise<AaveRiskWorkflowResult> {
  const startTime = Date.now();
  const runId = workflowRunId("aave-risk", startTime);

  let status: WorkflowStatus = "running";
  let signals = 0;

  try {
    // Step 1: Fetch on-chain data
    // TODO: Replace with real chain data fetching
    // Note: CRE WASM simulation runtime may not expose timer APIs like setTimeout.
    // Keep deterministic no-op here to avoid environment-specific timer failures.

    // Step 2: Compute risk signals
    // TODO: Replace with real signal computation
    signals = 0;

    // Step 3: Emit signals
    // TODO: Replace with real signal emission

    status = "completed";
  } catch {
    status = "failed";
  }

  return {
    runId,
    status,
    signals,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Trigger handler used by CRE runtime.
 * Runs the existing Aave workflow implementation and logs a concise summary.
 */
const onCronTrigger = async (runtime: { log: (message: string) => void }) => {
  const result = await executeAaveRiskWorkflow();
  runtime.log(
    `[aave-risk] runId=${result.runId} status=${result.status} signals=${result.signals} durationMs=${result.durationMs}`
  );
  return result;
};

/**
 * CRE workflow builder.
 * Uses a cron trigger so `cre workflow simulate` can execute trigger index 0.
 */
const initWorkflow = () => {
  const cron = new cre.capabilities.CronCapability();
  return [cre.handler(cron.trigger({ schedule: "*/5 * * * * *" }), onCronTrigger)];
};

/**
 * CRE CLI entrypoint expected by the compiler/runtime.
 */
export async function main(): Promise<void> {
  const runner = await Runner.newRunner();
  await runner.run(initWorkflow);
}
