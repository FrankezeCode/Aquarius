/**
 * Health Engine — In-Memory TTL Cache
 *
 * Lightweight cache for health scores to avoid recomputation on every request.
 * Protocol scores: 30s TTL, User scores: 10s TTL.
 *
 * No external dependencies (Redis not required for MVP).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class ScoreCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
