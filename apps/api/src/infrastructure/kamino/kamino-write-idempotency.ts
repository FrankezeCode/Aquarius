/**
 * In-memory idempotency for Kamino write requests (process-local).
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const DEFAULT_TTL_MS = 10 * 60_000;

function prune(now: number): void {
  for (const [k, v] of store.entries()) {
    if (v.expiresAt <= now) store.delete(k);
  }
}

export function getIdempotentResult<T>(key: string): T | undefined {
  prune(Date.now());
  const e = store.get(key) as Entry<T> | undefined;
  if (!e || e.expiresAt <= Date.now()) {
    if (e) store.delete(key);
    return undefined;
  }
  return e.value;
}

export function setIdempotentResult<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const now = Date.now();
  prune(now);
  store.set(key, { value, expiresAt: now + ttlMs });
}

export function resetKaminoWriteIdempotencyForTests(): void {
  store.clear();
}
