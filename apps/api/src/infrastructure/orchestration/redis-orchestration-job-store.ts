import Redis from "ioredis";
import type {
  OrchestrationJobStore,
  PersistedOrchestrationJob,
} from "../../application/ports/orchestration-job-store.port.js";

const JOB_PREFIX = "aquarius:orch:job:";
const IDEMP_PREFIX = "aquarius:orch:idem:";

/**
 * Redis-backed job + vault idempotency store for multi-instance staging.
 */
export class RedisOrchestrationJobStore implements OrchestrationJobStore {
  constructor(
    private readonly redis: Redis,
    private readonly jobTtlSeconds: number
  ) {}

  async putJob(job: PersistedOrchestrationJob): Promise<void> {
    const key = JOB_PREFIX + job.jobId;
    await this.redis.set(
      key,
      JSON.stringify(job),
      "EX",
      this.jobTtlSeconds
    );
  }

  async getJob(jobId: string): Promise<PersistedOrchestrationJob | null> {
    const raw = await this.redis.get(JOB_PREFIX + jobId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PersistedOrchestrationJob;
    } catch {
      return null;
    }
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
    const cur = await this.getJob(jobId);
    if (!cur) return;
    const next: PersistedOrchestrationJob = {
      ...cur,
      ...patch,
      updatedAt: Date.now(),
    };
    await this.putJob(next);
  }

  async getVaultIdempotency(key: string): Promise<Record<string, unknown> | null> {
    const raw = await this.redis.get(IDEMP_PREFIX + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async setVaultIdempotency(
    key: string,
    body: Record<string, unknown>,
    ttlMs: number
  ): Promise<void> {
    const sec = Math.max(1, Math.ceil(ttlMs / 1000));
    await this.redis.set(
      IDEMP_PREFIX + key,
      JSON.stringify(body),
      "EX",
      sec
    );
  }
}

export function createRedisClient(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  });
}
