/**
 * Solana JSON-RPC clients with primary/fallback routing for Kamino reads.
 *
 * Process-local state:
 * - Two independently cached @solana/kit clients (one per URL slot), reused
 *   across calls within a process.
 * - A provider-level circuit on the PRIMARY URL only: after `failureThreshold`
 *   consecutive recorded failures, calls are routed to the fallback URL for
 *   `circuitOpenMs`. After that window a single primary probe is allowed.
 * - The fallback never accumulates state at this layer; if it fails the caller
 *   surfaces the error through its own breakers/timeouts.
 *
 * Per-call timeouts and the operation-level circuit (in
 * `kamino-snapshot.service.ts`) continue to apply on top of this routing.
 */

import { createSolanaRpc, type Rpc } from "@solana/kit";

interface RpcCacheEntry {
  url: string;
  rpc: Rpc<unknown>;
}

let cachedPrimary: RpcCacheEntry | null = null;
let cachedFallback: RpcCacheEntry | null = null;

let primaryConsecutiveFailures = 0;
let primaryOpenUntilMs: number | null = null;

export type SolanaRpcProvider = "primary" | "fallback";

export interface SolanaRpcSelection {
  readonly url: string;
  readonly rpc: Rpc<unknown>;
  readonly provider: SolanaRpcProvider;
}

export interface PickSolanaRpcOptions {
  readonly primaryUrl: string;
  readonly fallbackUrl?: string;
  readonly failureThreshold: number;
  readonly circuitOpenMs: number;
  readonly now?: () => number;
}

function getOrCreateClient(
  url: string,
  which: SolanaRpcProvider
): RpcCacheEntry {
  const slot = which === "primary" ? cachedPrimary : cachedFallback;
  if (slot && slot.url === url) return slot;
  const entry: RpcCacheEntry = {
    url,
    rpc: createSolanaRpc(url) as Rpc<unknown>,
  };
  if (which === "primary") cachedPrimary = entry;
  else cachedFallback = entry;
  return entry;
}

/**
 * Returns true when the primary provider circuit is currently open.
 * Side effect: auto-closes the circuit when the window has expired.
 */
export function isPrimarySolanaRpcCircuitOpen(
  now: () => number = Date.now
): boolean {
  const t = now();
  if (primaryOpenUntilMs !== null && t >= primaryOpenUntilMs) {
    primaryOpenUntilMs = null;
    primaryConsecutiveFailures = 0;
  }
  return primaryOpenUntilMs !== null;
}

/**
 * Picks the active Solana RPC client for an operation.
 *
 * - Primary circuit closed → returns the primary client.
 * - Primary circuit open AND fallback URL configured → returns the fallback.
 * - Primary circuit open AND no fallback URL → still returns primary
 *   (caller's own timeouts/breakers absorb the failure).
 *
 * The selection should be held for the duration of one logical operation
 * to avoid mid-operation provider switches.
 */
export function pickSolanaRpc(opts: PickSolanaRpcOptions): SolanaRpcSelection {
  const now = opts.now ?? Date.now;
  const open = isPrimarySolanaRpcCircuitOpen(now);
  if (open && opts.fallbackUrl) {
    const entry = getOrCreateClient(opts.fallbackUrl, "fallback");
    return { url: entry.url, rpc: entry.rpc, provider: "fallback" };
  }
  const entry = getOrCreateClient(opts.primaryUrl, "primary");
  return { url: entry.url, rpc: entry.rpc, provider: "primary" };
}

/**
 * Records the outcome of an operation against the chosen provider.
 *
 * Only PRIMARY failures advance the provider-level circuit toward open.
 * Fallback outcomes are no-ops at this layer — callers may still record
 * per-provider observability metrics elsewhere.
 *
 * Callers should gate "ok = false" to genuine RPC failures (timeouts, RPC
 * errors, circuit-open). Logical not-found responses must NOT be reported
 * as failures — they would unnecessarily degrade primary.
 */
export function recordSolanaRpcOutcome(
  selection: Pick<SolanaRpcSelection, "provider">,
  ok: boolean,
  opts: {
    readonly failureThreshold: number;
    readonly circuitOpenMs: number;
    readonly now?: () => number;
  }
): void {
  if (selection.provider !== "primary") return;
  const now = opts.now ?? Date.now;
  if (ok) {
    primaryConsecutiveFailures = 0;
    return;
  }
  primaryConsecutiveFailures++;
  if (primaryConsecutiveFailures >= opts.failureThreshold) {
    primaryOpenUntilMs = now() + opts.circuitOpenMs;
    primaryConsecutiveFailures = 0;
  }
}

/**
 * Backward-compatible single-URL accessor. Caches the URL in the PRIMARY
 * slot. New code should prefer `pickSolanaRpc` so fallback routing applies.
 */
export function getSolanaRpcForUrl(rpcUrl: string): Rpc<unknown> {
  return getOrCreateClient(rpcUrl, "primary").rpc;
}

export function resetSolanaRpcCacheForTests(): void {
  cachedPrimary = null;
  cachedFallback = null;
  primaryConsecutiveFailures = 0;
  primaryOpenUntilMs = null;
}
