/**
 * Last-good Kamino snapshot cache for CRE stale fallback (wallet + market key).
 */

import type { KaminoRiskSnapshot } from "@aquarius/types";

interface Entry {
  readonly fetchedAtMs: number;
  readonly snapshot: KaminoRiskSnapshot;
}

const store = new Map<string, Entry>();

export function snapshotStaleCacheKey(
  walletBase58: string,
  marketPubkeyBase58: string
): string {
  return `${walletBase58.trim()}:${marketPubkeyBase58.trim()}`;
}

export function setCachedSnapshot(
  walletBase58: string,
  marketPubkeyBase58: string,
  snapshot: KaminoRiskSnapshot
): void {
  store.set(snapshotStaleCacheKey(walletBase58, marketPubkeyBase58), {
    fetchedAtMs: Date.now(),
    snapshot,
  });
}

export function getCachedSnapshotIfFresh(
  walletBase58: string,
  marketPubkeyBase58: string,
  maxAgeMs: number
): { snapshot: KaminoRiskSnapshot; ageMs: number } | undefined {
  const e = store.get(snapshotStaleCacheKey(walletBase58, marketPubkeyBase58));
  if (!e) return undefined;
  const ageMs = Date.now() - e.fetchedAtMs;
  if (ageMs > maxAgeMs) return undefined;
  return { snapshot: e.snapshot, ageMs };
}

export function resetKaminoSnapshotStaleCacheForTests(): void {
  store.clear();
}
