import { loadConfig } from "../../config/index.js";
import {
  CreOrchestrationAdapter,
  type CreOrchestrationAdapterDeps,
} from "./cre-orchestration.adapter.js";
import {
  getOrchestrationJobStore,
  resetOrchestrationJobStoreForTests,
} from "./orchestration-job-store.singleton.js";
import { resetBufferSolvencyServiceForTests } from "../buffer-solvency.singleton.js";
import { resetPosDelegationExecutorForTests } from "../pos-delegation-executor.singleton.js";
import { resetVaultIntentExecutorForTests } from "./vault-intent-executor.singleton.js";

export { CreOrchestrationAdapter };
export type { CreOrchestrationAdapterDeps };
export {
  getOrchestrationJobStore,
  resetOrchestrationJobStoreForTests,
} from "./orchestration-job-store.singleton.js";

/** New adapter instance (tests, isolated runs). */
export function createCreOrchestrationAdapter(
  deps?: CreOrchestrationAdapterDeps
): CreOrchestrationAdapter {
  return new CreOrchestrationAdapter(deps);
}

let sharedAdapter: CreOrchestrationAdapter | null = null;

/** Process-wide singleton for HTTP routes so /run and /demo share one job store. */
export function getCreOrchestrationAdapter(): CreOrchestrationAdapter {
  sharedAdapter ??= (() => {
    const cfg = loadConfig();
    return new CreOrchestrationAdapter({
      executionMode: cfg.orchestrationExecutionMode,
      jobStore: getOrchestrationJobStore(),
      vaultIntentCreWorkflowId: cfg.vaultIntentCreWorkflowId,
      creVaultWorkflowTriggerUrl: cfg.creVaultWorkflowTriggerUrl,
      creVaultWorkflowTriggerToken: cfg.creVaultWorkflowTriggerToken,
      creVaultWorkflowTriggerTimeoutMs: cfg.creVaultWorkflowTriggerTimeoutMs,
      vaultCreCallbackUrl: cfg.vaultCreCallbackUrl,
      vaultProtocolSimulatedOwner: cfg.vaultProtocolSimulatedOwner,
    });
  })();
  return sharedAdapter;
}

/** Clears the singleton so the next `getCreOrchestrationAdapter()` picks up fresh config (tests only). */
export function resetCreOrchestrationAdapterForTests(): void {
  sharedAdapter = null;
  resetOrchestrationJobStoreForTests();
  resetBufferSolvencyServiceForTests();
  resetVaultIntentExecutorForTests();
  resetPosDelegationExecutorForTests();
}
