/**
 * API-as-a-Product Layer — RiskQueryService
 *
 * Multi-protocol, concurrency-safe, lazy-refresh query service.
 * Hackathon mode: no auth.  Strictly decoupled from CRE.
 *
 * The cache always stores normalized MonitorSnapshot objects.
 * No route ever sees raw domain-specific MonitorResult.
 *
 * Read path (hot):
 *   1. Build snapshot key  — O(1)
 *   2. Map.get()           — O(1)
 *   3. DTO projection      — O(1)
 *   → Sub-millisecond.  No await.  No recomputation.
 *
 * Cold-start / TTL-expired path:
 *   1. Single lazy refresh per protocol+chain (concurrency-safe)
 *   2. Other concurrent requests await the same promise
 *   3. Background TTL refresh returns stale data immediately
 *
 * DDD: This service lives in the shared application layer and depends
 * only on the RiskMonitor port and shared types — never on domain
 * internals directly.
 */

import {
  Protocol,
  type Chain,
  type SnapshotKey,
  buildSnapshotKey,
  DEFAULT_CHAIN,
} from "../../types/risk-api.types.js";
import type { MonitorSnapshot } from "../../types/monitor-snapshot.types.js";
import { stubSnapshot } from "../../types/monitor-snapshot.types.js";
import { getMonitor } from "../monitors/monitor-registry.js";

// ── Re-export MonitorSnapshot for consumers ──────────────────────────

export type { MonitorSnapshot };

// ── DTO Types ────────────────────────────────────────────────────────

export interface RiskHealthDTO {
  readonly protocol: string;
  readonly chain: string;
  readonly globalRiskIndex: number;
  readonly liquidationPressure: number;
  readonly timestamp: string;
}

// Legacy DTO aliases (backward compatibility for existing route tests)
export type RiskLevel = string;
export type PressureSeverity = "low" | "moderate" | "high";
export type HfTrend = "improving" | "declining" | "stable";

export interface LiquidationPressureDTO {
  readonly protocol: string;
  readonly chain: string;
  readonly globalRiskIndex: number;
  readonly liquidationPressure: number;
  readonly timestamp: string;
}

// ── Cache Entry ──────────────────────────────────────────────────────

interface CacheEntry {
  snapshot: MonitorSnapshot;
  cachedAt: number; // Unix ms
}

// ── RiskQueryService ─────────────────────────────────────────────────

export class RiskQueryService {
  /** In-memory snapshot cache keyed by protocol:chain. */
  private readonly snapshots = new Map<SnapshotKey, CacheEntry>();

  /**
   * Concurrency-safe refresh locks.
   * If a lazy refresh is in flight for a key, subsequent requests
   * await the same promise instead of triggering duplicate runs.
   */
  private readonly refreshLocks = new Map<SnapshotKey, Promise<void>>();

  /** Snapshot TTL in milliseconds.  Stale data served while refreshing. */
  private readonly TTL_MS: number;

  constructor(ttlMs = 30_000) {
    this.TTL_MS = ttlMs;
  }

  // ── Write path (called by CRE webhook / external ingestion) ──────

  /**
   * Push a fresh MonitorSnapshot into the cache.
   * Called by the application layer after a pipeline run completes.
   * O(1), synchronous, no side-effects.
   */
  updateSnapshot(snapshot: MonitorSnapshot): void {
    const key = buildSnapshotKey(snapshot.protocol, snapshot.chain);
    this.snapshots.set(key, { snapshot, cachedAt: Date.now() });
  }

  // ── Read path (called by route handlers) ──────────────────────────

  /**
   * Get the health DTO for a protocol + chain.
   *
   * Hot path (cache hit + fresh):  synchronous O(1).
   * Cold start / TTL expired:      triggers one lazy refresh, returns
   *                                 stale data or safe defaults immediately.
   */
  getHealth(
    protocol: Protocol,
    chain: Chain = DEFAULT_CHAIN
  ): RiskHealthDTO {
    const key = buildSnapshotKey(protocol, chain);
    const entry = this.snapshots.get(key);

    // Schedule background refresh if stale or missing
    this.maybeRefresh(protocol, chain, key, entry);

    const snapshot = entry?.snapshot ?? stubSnapshot(protocol, chain);

    return {
      protocol: snapshot.protocol,
      chain: snapshot.chain,
      globalRiskIndex: snapshot.globalRiskIndex,
      liquidationPressure: snapshot.liquidationPressure,
      timestamp: snapshot.timestamp,
    };
  }

  /**
   * Get the liquidation pressure DTO for a protocol + chain.
   *
   * Same latency characteristics as getHealth().
   */
  getLiquidationPressure(
    protocol: Protocol,
    chain: Chain = DEFAULT_CHAIN
  ): LiquidationPressureDTO {
    const key = buildSnapshotKey(protocol, chain);
    const entry = this.snapshots.get(key);

    this.maybeRefresh(protocol, chain, key, entry);

    const snapshot = entry?.snapshot ?? stubSnapshot(protocol, chain);

    return {
      protocol: snapshot.protocol,
      chain: snapshot.chain,
      globalRiskIndex: snapshot.globalRiskIndex,
      liquidationPressure: snapshot.liquidationPressure,
      timestamp: snapshot.timestamp,
    };
  }

  /**
   * Get the raw cached MonitorSnapshot for a protocol + chain.
   * Returns a stub if nothing is cached yet.
   */
  getSnapshot(
    protocol: Protocol,
    chain: Chain = DEFAULT_CHAIN
  ): MonitorSnapshot {
    const key = buildSnapshotKey(protocol, chain);
    const entry = this.snapshots.get(key);

    this.maybeRefresh(protocol, chain, key, entry);

    return entry?.snapshot ?? stubSnapshot(protocol, chain);
  }

  /**
   * Check whether a snapshot is cached for the given protocol + chain.
   */
  hasSnapshot(
    protocol: Protocol,
    chain: Chain = DEFAULT_CHAIN
  ): boolean {
    return this.snapshots.has(buildSnapshotKey(protocol, chain));
  }

  // ── Lazy Refresh (concurrency-safe, non-blocking) ─────────────────

  /**
   * If the snapshot is missing or stale, schedule a single background
   * refresh.  Concurrent callers coalesce onto the same promise.
   *
   * IMPORTANT: This method is fire-and-forget — it never blocks the
   * caller.  The current (possibly stale) snapshot is returned
   * immediately by the calling read method.
   */
  private maybeRefresh(
    protocol: Protocol,
    chain: Chain,
    key: SnapshotKey,
    entry: CacheEntry | undefined
  ): void {
    const isMissing = !entry;
    const isStale = entry != null && Date.now() - entry.cachedAt > this.TTL_MS;

    if (!isMissing && !isStale) return; // Cache is fresh — nothing to do.

    // Already refreshing?  Don't duplicate.
    if (this.refreshLocks.has(key)) return;

    const monitor = getMonitor(protocol);
    if (!monitor) return; // Protocol has no registered monitor.

    // Launch single refresh — fire-and-forget.
    const refreshPromise = monitor
      .run(chain)
      .then((snapshot) => {
        this.snapshots.set(key, { snapshot, cachedAt: Date.now() });
        console.info(
          `[risk-query] REFRESH | ${key} globalRiskIndex=${snapshot.globalRiskIndex} liquidationPressure=${snapshot.liquidationPressure}`
        );
      })
      .catch((err) => {
        console.error(`[risk-query] REFRESH FAILED | ${key}`, err);
      })
      .finally(() => {
        this.refreshLocks.delete(key);
      });

    this.refreshLocks.set(key, refreshPromise);
  }

  // ── Await refresh (for cold-start callers that want to wait) ──────

  /**
   * If a lazy refresh is in flight for the given key, await it.
   * Useful for cold-start scenarios where the caller is willing to
   * wait for the first snapshot rather than receive safe defaults.
   *
   * If no refresh is pending, resolves immediately.
   */
  async awaitRefresh(
    protocol: Protocol,
    chain: Chain = DEFAULT_CHAIN
  ): Promise<void> {
    const key = buildSnapshotKey(protocol, chain);

    // Trigger refresh if not already in flight
    const entry = this.snapshots.get(key);
    this.maybeRefresh(protocol, chain, key, entry);

    const pending = this.refreshLocks.get(key);
    if (pending) await pending;
  }
}
