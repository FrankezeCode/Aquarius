/**
 * Lightweight per-domain observability (process-local; replace with Prometheus in prod if needed).
 *
 * Two layers:
 * - Aggregate latency / error rate across the kamino-solana RPC surface
 *   (top-level fields; preserved for back-compat).
 * - Per-provider buckets (primary | fallback) plus a fallback activation
 *   counter so ops can distinguish a primary outage from a fallback outage.
 */

import { KAMINO_INTELLIGENCE_VERSION } from "../protocols/kamino-solana/risk-intelligence/scorer.js";
import { isPrimarySolanaRpcCircuitOpen } from "../infrastructure/kamino/solana-rpc.js";

const KAMINO_DOMAIN = "kamino-solana" as const;
const LATENCY_RING_MAX = 256;

export type KaminoRpcProvider = "primary" | "fallback";

interface ProviderMetricBucket {
  latencies: number[];
  success: number;
  errors: number;
}

function newProviderBucket(): ProviderMetricBucket {
  return { latencies: [], success: 0, errors: 0 };
}

const providerBuckets: Record<KaminoRpcProvider, ProviderMetricBucket> = {
  primary: newProviderBucket(),
  fallback: newProviderBucket(),
};

const aggregateLatencies: number[] = [];
let aggregateSuccess = 0;
let aggregateErrors = 0;

let fallbackActivationCount = 0;

function pushLatency(target: number[], latencyMs: number): void {
  if (target.length >= LATENCY_RING_MAX) target.shift();
  target.push(latencyMs);
}

function percentileFromSorted(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0] ?? 0;
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const a = sorted[lo] ?? 0;
  const b = sorted[hi] ?? a;
  return a + (b - a) * (rank - lo);
}

function summarizeLatency(samples: readonly number[]): {
  readonly p50: number;
  readonly p95: number;
  readonly sampleCount: number;
} {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    p50: Math.round(percentileFromSorted(sorted, 50)),
    p95: Math.round(percentileFromSorted(sorted, 95)),
    sampleCount: sorted.length,
  };
}

export function recordKaminoRpcLatency(
  latencyMs: number,
  provider: KaminoRpcProvider = "primary"
): void {
  pushLatency(aggregateLatencies, latencyMs);
  aggregateSuccess++;
  pushLatency(providerBuckets[provider].latencies, latencyMs);
  providerBuckets[provider].success++;
}

export function recordKaminoRpcError(
  provider: KaminoRpcProvider = "primary"
): void {
  aggregateErrors++;
  providerBuckets[provider].errors++;
}

/** Counts each time an operation was routed to the fallback provider. */
export function recordKaminoFallbackActivation(): void {
  fallbackActivationCount++;
}

export function getKaminoSolanaMetrics() {
  const aggregateTotal = aggregateSuccess + aggregateErrors;
  return {
    domain: KAMINO_DOMAIN,
    intelligenceVersion: KAMINO_INTELLIGENCE_VERSION,
    rpcLatencyMs: summarizeLatency(aggregateLatencies),
    rpcErrorRate: aggregateTotal === 0 ? 0 : aggregateErrors / aggregateTotal,
    primaryCircuitOpen: isPrimarySolanaRpcCircuitOpen(),
    fallbackActivationCount,
    providers: {
      primary: {
        successCount: providerBuckets.primary.success,
        errorCount: providerBuckets.primary.errors,
        latencyMs: summarizeLatency(providerBuckets.primary.latencies),
      },
      fallback: {
        successCount: providerBuckets.fallback.success,
        errorCount: providerBuckets.fallback.errors,
        latencyMs: summarizeLatency(providerBuckets.fallback.latencies),
      },
    },
  } as const;
}

export function resetDomainMetricsForTests(): void {
  aggregateLatencies.length = 0;
  aggregateSuccess = 0;
  aggregateErrors = 0;
  fallbackActivationCount = 0;
  providerBuckets.primary = newProviderBucket();
  providerBuckets.fallback = newProviderBucket();
}
