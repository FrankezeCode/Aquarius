/**
 * Kamino Risk Workflow — CRE entry point (stub).
 *
 * Real monitoring and callbacks are expected to target the Aquarius API
 * (`/api/internal/ingest/cre-webhook` with workflowId kamino-risk*).
 * This workflow provides a CRE CLI–compatible cron shell matching `aave-risk`.
 */

import { workflowRunId } from "../shared/utils.js";
import { type WorkflowStatus } from "../shared/constants.js";
import { cre, Runner } from "@chainlink/cre-sdk";

export interface KaminoRiskWorkflowResult {
  runId: string;
  status: WorkflowStatus;
  signals: number;
  durationMs: number;
}

export async function executeKaminoRiskWorkflow(): Promise<KaminoRiskWorkflowResult> {
  const startTime = Date.now();
  const runId = workflowRunId("kamino-risk", startTime);
  let status: WorkflowStatus = "completed";
  const signals = 0;
  return {
    runId,
    status,
    signals,
    durationMs: Date.now() - startTime,
  };
}

const onCronTrigger = async (runtime: { log: (message: string) => void }) => {
  const result = await executeKaminoRiskWorkflow();
  runtime.log(
    `[kamino-risk] runId=${result.runId} status=${result.status} signals=${result.signals} durationMs=${result.durationMs}`
  );
  return result;
};

const initWorkflow = () => {
  const cron = new cre.capabilities.CronCapability();
  return [cre.handler(cron.trigger({ schedule: "*/5 * * * * *" }), onCronTrigger)];
};

export async function main(): Promise<void> {
  const runner = await Runner.newRunner();
  await runner.run(initWorkflow);
}
