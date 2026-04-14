/**
 * Vault execution port — optional façade over OrchestrationPort for vault/buffer intents.
 *
 * Phase 2: delegates 1:1 so vault modules can depend on a narrower surface without
 * importing CRE workflow internals.
 */

import type {
  OrchestrationIntent,
  OrchestrationPort,
  OrchestrationSubmitResult,
} from "./orchestration.port.js";

export interface VaultExecutionPort {
  submitVaultIntent(
    intent: OrchestrationIntent
  ): Promise<OrchestrationSubmitResult>;
  getVaultJobStatus(jobId: string): Promise<OrchestrationSubmitResult | null>;
}

export function createVaultExecutionPort(
  orchestration: OrchestrationPort
): VaultExecutionPort {
  return {
    submitVaultIntent: (intent) => orchestration.submitIntent(intent),
    getVaultJobStatus: (jobId) => orchestration.getJobStatus(jobId),
  };
}
