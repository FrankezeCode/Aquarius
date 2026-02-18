/**
 * Selva Runtime — Execution Limiter
 *
 * Prevents infinite automation loops by enforcing a per-key
 * cooldown window.  Backed by a pluggable ExecutionStore so it
 * works in-memory (default) or with Redis / Dynamo / etc.
 *
 * All methods are async to support distributed stores.
 *
 * Usage:
 * ```ts
 * const limiter = new ExecutionLimiter(10_000); // 10s, memory store
 * await limiter.assertCanExecute("aave:1");     // ok first time
 * await limiter.assertCanExecute("aave:1");     // throws if < 10s
 *
 * // With custom store:
 * const limiter = new ExecutionLimiter(10_000, redisStore);
 * ```
 */

import { SelvaExecutionBlocked } from "./errors.js";
import { MemoryExecutionStore, type ExecutionStore } from "./store.js";

export class ExecutionLimiter {
  private readonly cooldownMs: number;
  private readonly store: ExecutionStore;

  constructor(cooldownMs: number, store?: ExecutionStore) {
    this.cooldownMs = cooldownMs;
    this.store = store ?? new MemoryExecutionStore();
  }

  /**
   * Assert that execution is allowed for the given key.
   * Throws SelvaExecutionBlocked if cooldown is active.
   * Records the execution timestamp on success.
   */
  async assertCanExecute(key: string): Promise<void> {
    const now = Date.now();
    const last = await this.store.get(key);

    if (last !== null && now - last < this.cooldownMs) {
      const remaining = this.cooldownMs - (now - last);
      throw new SelvaExecutionBlocked(
        `Execution blocked: cooldown active for "${key}" (${remaining}ms remaining)`
      );
    }

    await this.store.set(key, now);
  }
}
