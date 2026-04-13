/**
 * Short-TTL cache for `KaminoMarket.load` to avoid repeated heavy RPC for the same market.
 */

import { address, type Address } from "@solana/kit";
import type { Config } from "../../config/index.js";
import { withTimeout } from "./timeout.js";
import { getSolanaRpcForUrl } from "./solana-rpc.js";

interface CacheEntry {
  expiresAt: number;
  /** Loaded Klend market (opaque; avoid coupling callers to SDK class). */
  market: NonNullable<
    Awaited<
      ReturnType<
        typeof import("@kamino-finance/klend-sdk").KaminoMarket.load
      >
    >
  >;
}

const marketLoadCache = new Map<string, CacheEntry>();

function cacheKeyForMarket(marketPubkeyBase58: string): string {
  return marketPubkeyBase58.trim();
}

export function resetKaminoMarketLoadCacheForTests(): void {
  marketLoadCache.clear();
}

/**
 * Loads a Kamino market with process-local TTL caching (metadata hot path).
 */
export async function loadKaminoMarketCached(input: {
  config: Config;
  rpc: ReturnType<typeof getSolanaRpcForUrl>;
  marketPubkeyBase58: string;
}): Promise<CacheEntry["market"] | null> {
  const { config, rpc, marketPubkeyBase58 } = input;
  const ttlMs = config.kaminoMarketLoadCacheTtlMs;
  const key = cacheKeyForMarket(marketPubkeyBase58);
  const now = Date.now();

  if (ttlMs > 0) {
    const hit = marketLoadCache.get(key);
    if (hit && hit.expiresAt > now) {
      return hit.market;
    }
  }

  const { KaminoMarket } = await import("@kamino-finance/klend-sdk");
  const marketAddress = address(marketPubkeyBase58) as Address;

  const market = await withTimeout(
    KaminoMarket.load(
      rpc as Parameters<typeof KaminoMarket.load>[0],
      marketAddress,
      config.kaminoRecentSlotMs,
      undefined,
      true
    ),
    config.kaminoRpcTimeoutMs,
    "KaminoMarket.load(cached)"
  );

  if (market && ttlMs > 0) {
    marketLoadCache.set(key, {
      market,
      expiresAt: now + ttlMs,
    });
  }

  return market;
}
