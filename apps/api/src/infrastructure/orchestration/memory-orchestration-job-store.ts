import type {
  OrchestrationJobStore,
  PersistedOrchestrationJob,
} from "../../application/ports/orchestration-job-store.port.js";

const MAX_JOBS = 2000;

/**
 * In-process job + idempotency store (dev / tests). Not suitable for multi-instance staging.
 */
export class MemoryOrchestrationJobStore implements OrchestrationJobStore {
  private readonly jobs = new Map<string, PersistedOrchestrationJob>();
  private readonly jobOrder: string[] = [];
  private readonly idemp = new Map<
    string,
    { body: Record<string, unknown>; expiresAt: number }
  >();

  async putJob(job: PersistedOrchestrationJob): Promise<void> {
    if (!this.jobs.has(job.jobId)) {
      this.jobOrder.push(job.jobId);
    }
    this.jobs.set(job.jobId, job);
    while (this.jobOrder.length > MAX_JOBS) {
      const oldest = this.jobOrder.shift();
      if (oldest) this.jobs.delete(oldest);
    }
  }

  async getJob(jobId: string): Promise<PersistedOrchestrationJob | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async patchJob(
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
  ): Promise<void> {
    const cur = this.jobs.get(jobId);
    if (!cur) return;
    const next: PersistedOrchestrationJob = {
      ...cur,
      ...patch,
      updatedAt: Date.now(),
    };
    this.jobs.set(jobId, next);
  }

  async getVaultIdempotency(key: string): Promise<Record<string, unknown> | null> {
    const row = this.idemp.get(key);
    if (!row) return null;
    if (Date.now() > row.expiresAt) {
      this.idemp.delete(key);
      return null;
    }
    return row.body;
  }

  async setVaultIdempotency(
    key: string,
    body: Record<string, unknown>,
    ttlMs: number
  ): Promise<void> {
    this.idemp.set(key, {
      body,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /** Test helper. */
  clear(): void {
    this.jobs.clear();
    this.jobOrder.length = 0;
    this.idemp.clear();
  }
}
