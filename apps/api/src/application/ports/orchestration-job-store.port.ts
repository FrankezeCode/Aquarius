/**
 * Persistence for orchestration jobs and vault-gateway idempotency (Redis or in-memory).
 * Enables multi-instance staging and survives process restarts when Redis is configured.
 */

import type { CREWorkflowResult } from "../../../../../packages/domain/cre/run-cre-workflow.js";
import type { OrchestrationJobStatus } from "./orchestration.port.js";

export interface PersistedOrchestrationJob {
  readonly jobId: string;
  readonly status: OrchestrationJobStatus;
  readonly correlationId?: string;
  /** CRE workflow definition id (traceability). */
  readonly workflowDefinitionId?: string;
  /** Remote CRE run / request id when async trigger is used. */
  readonly externalWorkflowId?: string;
  readonly result?: CREWorkflowResult;
  readonly error?: string;
  readonly updatedAt: number;
}

export interface OrchestrationJobStore {
  putJob(job: PersistedOrchestrationJob): Promise<void>;
  getJob(jobId: string): Promise<PersistedOrchestrationJob | null>;
  patchJob(
    jobId: string,
    patch: Partial<
      Pick<
        PersistedOrchestrationJob,
        | "status"
        | "result"
        | "error"
        | "externalWorkflowId"
        | "workflowDefinitionId"
      >
    >
  ): Promise<void>;

  /** Vault POST idempotency: GET before submit; SET after accepted response. */
  getVaultIdempotency(key: string): Promise<Record<string, unknown> | null>;
  setVaultIdempotency(
    key: string,
    body: Record<string, unknown>,
    ttlMs: number
  ): Promise<void>;
}
