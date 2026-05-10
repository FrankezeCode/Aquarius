/**
 * Live Kamino lending snapshot — RPC + Klend SDK (read-only).
 *
 * Klend SDK is dynamically imported so route registration (e.g. tests hitting /health)
 * does not eagerly load the full Solana / protocol dependency graph.
 */

import type { KaminoRiskSnapshot } from "@aquarius/types";
import { address } from "@solana/kit";
import type { Config } from "../../config/index.js";
import type { KaminoCluster } from "../../domain/ports/kamino.js";
import { mapKaminoObligationToSnapshot } from "./mappers/obligation-to-snapshot.js";
import { loadKaminoMarketCached } from "./kamino-market-load-cache.js";
import {
  getCachedSnapshotIfFresh,
  setCachedSnapshot,
} from "./kamino-snapshot-stale-cache.js";
import {
  recordKaminoFallbackActivation,
  recordKaminoRpcError,
  recordKaminoRpcLatency,
} from "../../observability/domain-metrics.js";
import { createCircuitBreaker, CircuitOpenError } from "./circuit-breaker.js";
import { pickSolanaRpc, recordSolanaRpcOutcome } from "./solana-rpc.js";
import { withTimeout, TimeoutError } from "./timeout.js";

export type KaminoSnapshotFailureCode =
  | "KAMINO_READ_DISABLED"
  | "CIRCUIT_OPEN"
  | "TIMEOUT"
  | "MARKET_NOT_FOUND"
  | "OBLIGATION_NOT_FOUND"
  | "RPC_ERROR";

export class KaminoSnapshotError extends Error {
  constructor(
    public readonly code: KaminoSnapshotFailureCode,
    message: string,
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "KaminoSnapshotError";
  }
}

let breakerCache: {
  key: string;
  breaker: ReturnType<typeof createCircuitBreaker>;
} | null = null;

function getBreaker(config: Config) {
  const key = `${config.kaminoCircuitFailureThreshold}:${config.kaminoCircuitOpenMs}`;
  if (!breakerCache || breakerCache.key !== key) {
    breakerCache = {
      key,
      breaker: createCircuitBreaker({
        failureThreshold: config.kaminoCircuitFailureThreshold,
        openDurationMs: config.kaminoCircuitOpenMs,
      }),
    };
  }
  return breakerCache.breaker;
}

function shouldCountAsRpcFailure(code: KaminoSnapshotFailureCode): boolean {
  return (
    code === "TIMEOUT" ||
    code === "RPC_ERROR" ||
    code === "CIRCUIT_OPEN" ||
    code === "MARKET_NOT_FOUND"
  );
}

export async function fetchKaminoRiskSnapshot(input: {
  config: Config;
  wallet: string;
  marketPubkey: string;
}): Promise<KaminoRiskSnapshot> {
  const { config, wallet, marketPubkey } = input;

  if (!config.kaminoReadEnabled || !config.solanaRpcUrl) {
    throw new KaminoSnapshotError(
      "KAMINO_READ_DISABLED",
      "Kamino live read is disabled or SOLANA_RPC_URL is not set."
    );
  }

  const cluster = config.solanaCluster as KaminoCluster;
  const selection = pickSolanaRpc({
    primaryUrl: config.solanaRpcUrl,
    fallbackUrl: config.solanaRpcFallbackUrl,
    failureThreshold: config.kaminoCircuitFailureThreshold,
    circuitOpenMs: config.kaminoCircuitOpenMs,
  });
  if (selection.provider === "fallback") {
    recordKaminoFallbackActivation();
  }
  const rpc = selection.rpc;
  const owner = address(wallet);

  const run = async () => {
    const { VanillaObligation, PROGRAM_ID } = await import(
      "@kamino-finance/klend-sdk"
    );
    const vanilla = new VanillaObligation(PROGRAM_ID);

    const t0 = performance.now();
    const market = await loadKaminoMarketCached({
      config,
      rpc,
      marketPubkeyBase58: marketPubkey,
    });

    if (!market) {
      throw new KaminoSnapshotError(
        "MARKET_NOT_FOUND",
        "Kamino lending market could not be loaded for this address."
      );
    }

    const obligation = await withTimeout(
      market.getObligationByWallet(owner, vanilla),
      config.kaminoRpcTimeoutMs,
      "getObligationByWallet"
    );

    if (!obligation) {
      recordKaminoRpcLatency(
        Math.round(performance.now() - t0),
        selection.provider
      );
      throw new KaminoSnapshotError(
        "OBLIGATION_NOT_FOUND",
        "No vanilla Kamino lending obligation found for this wallet on this market."
      );
    }

    const snapshot = mapKaminoObligationToSnapshot({
      obligation,
      market,
      marketPubkeyBase58: marketPubkey,
      walletBase58: wallet,
      cluster,
    });

    recordKaminoRpcLatency(
      Math.round(performance.now() - t0),
      selection.provider
    );
    setCachedSnapshot(wallet, marketPubkey, snapshot);
    return snapshot;
  };

  const providerOutcomeOpts = {
    failureThreshold: config.kaminoCircuitFailureThreshold,
    circuitOpenMs: config.kaminoCircuitOpenMs,
  } as const;

  try {
    const result = await getBreaker(config).execute(() =>
      withTimeout(
        run(),
        config.kaminoRpcTimeoutMs,
        "fetchKaminoRiskSnapshot"
      )
    );
    recordSolanaRpcOutcome(selection, true, providerOutcomeOpts);
    return result;
  } catch (e) {
    if (e instanceof KaminoSnapshotError) {
      const isRpcFailure = shouldCountAsRpcFailure(e.code);
      if (isRpcFailure) {
        recordKaminoRpcError(selection.provider);
      }
      recordSolanaRpcOutcome(selection, !isRpcFailure, providerOutcomeOpts);
      throw e;
    }
    if (e instanceof CircuitOpenError) {
      recordKaminoRpcError(selection.provider);
      recordSolanaRpcOutcome(selection, false, providerOutcomeOpts);
      throw new KaminoSnapshotError(
        "CIRCUIT_OPEN",
        e.message,
        e.retryAfterMs
      );
    }
    if (e instanceof TimeoutError) {
      recordKaminoRpcError(selection.provider);
      recordSolanaRpcOutcome(selection, false, providerOutcomeOpts);
      throw new KaminoSnapshotError(
        "TIMEOUT",
        "Solana RPC request timed out."
      );
    }
    recordKaminoRpcError(selection.provider);
    recordSolanaRpcOutcome(selection, false, providerOutcomeOpts);
    const msg = e instanceof Error ? e.message : "Solana RPC error";
    throw new KaminoSnapshotError("RPC_ERROR", msg);
  }
}

/** CRE ingestion: prefer live RPC; optional last-good snapshot when RPC is slow/unavailable. */
export type KaminoSnapshotFreshness =
  | { readonly live: true }
  | {
      readonly live: false;
      readonly staleAgeMs: number;
      readonly fallbackReason: KaminoSnapshotFailureCode;
    };

/**
 * Async (non-blocking) live snapshot fetch to warm cache after CRE served a stale body.
 * Does not affect the current request lifecycle.
 */
export function scheduleKaminoSnapshotCacheWarm(input: {
  config: Config;
  wallet: string;
  marketPubkey: string;
}): void {
  setImmediate(() => {
    void fetchKaminoRiskSnapshot(input).catch(() => undefined);
  });
}

export async function fetchKaminoRiskSnapshotForCre(input: {
  config: Config;
  wallet: string;
  marketPubkey: string;
}): Promise<{
  snapshot: KaminoRiskSnapshot;
  freshness: KaminoSnapshotFreshness;
}> {
  try {
    const snapshot = await fetchKaminoRiskSnapshot(input);
    return { snapshot, freshness: { live: true } };
  } catch (e) {
    if (!(e instanceof KaminoSnapshotError)) throw e;
    if (
      !input.config.kaminoCreStaleSnapshotEnabled ||
      e.code === "OBLIGATION_NOT_FOUND" ||
      e.code === "KAMINO_READ_DISABLED"
    ) {
      throw e;
    }
    const recoverable: readonly KaminoSnapshotFailureCode[] = [
      "TIMEOUT",
      "CIRCUIT_OPEN",
      "RPC_ERROR",
      "MARKET_NOT_FOUND",
    ];
    if (!recoverable.includes(e.code)) throw e;

    const hit = getCachedSnapshotIfFresh(
      input.wallet,
      input.marketPubkey,
      input.config.kaminoStaleSnapshotMaxAgeMs
    );
    if (!hit) throw e;

    return {
      snapshot: hit.snapshot,
      freshness: {
        live: false,
        staleAgeMs: hit.ageMs,
        fallbackReason: e.code,
      },
    };
  }
}
