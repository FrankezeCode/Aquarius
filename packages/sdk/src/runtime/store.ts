/**
 * Selva Runtime — Execution Store
 *
 * Pluggable persistence interface for cooldown tracking.
 * The runtime depends on this interface — never on a concrete
 * implementation.
 *
 * Ships with MemoryExecutionStore (default, in-process).
 * Consumers can provide RedisExecutionStore, DynamoExecutionStore,
 * etc. for distributed / infra-grade deployments.
 */

// ── Interface ────────────────────────────────────────────────────────

export interface ExecutionStore {
  /** Get the last execution timestamp for a key.  null if never executed. */
  get(key: string): Promise<number | null>;
  /** Set the last execution timestamp for a key. */
  set(key: string, timestamp: number): Promise<void>;
}

// ── Default Implementation ───────────────────────────────────────────

/**
 * In-memory execution store.  Suitable for single-process,
 * single-instance deployments and testing.
 */
export class MemoryExecutionStore implements ExecutionStore {
  private readonly data = new Map<string, number>();

  async get(key: string): Promise<number | null> {
    return this.data.get(key) ?? null;
  }

  async set(key: string, timestamp: number): Promise<void> {
    this.data.set(key, timestamp);
  }

  /** Clear a single key (useful for testing). */
  delete(key: string): void {
    this.data.delete(key);
  }

  /** Clear all keys. */
  clear(): void {
    this.data.clear();
  }
}
