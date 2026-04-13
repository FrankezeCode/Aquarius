/**
 * Lightweight per-domain observability (process-local; replace with Prometheus in prod if needed).
 */

import { KAMINO_INTELLIGENCE_VERSION } from "../protocols/kamino-solana/risk-intelligence/scorer.js";

const KAMINO_DOMAIN = "kamino-solana" as const;
const LATENCY_RING_MAX = 256;

const kaminoRpcLatenciesMs: number[] = [];
let kaminoRpcSuccess = 0;
let kaminoRpcErrors = 0;

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

export function recordKaminoRpcLatency(latencyMs: number): void {
  kaminoRpcSuccess++;
  if (kaminoRpcLatenciesMs.length >= LATENCY_RING_MAX) {
    kaminoRpcLatenciesMs.shift();
  }
  kaminoRpcLatenciesMs.push(latencyMs);
}

export function recordKaminoRpcError(): void {
  kaminoRpcErrors++;
}

export function getKaminoSolanaMetrics(): {
  readonly domain: typeof KAMINO_DOMAIN;
  readonly intelligenceVersion: typeof KAMINO_INTELLIGENCE_VERSION;
  readonly rpcLatencyMs: { p50: number; p95: number; sampleCount: number };
  readonly rpcErrorRate: number;
} {
  const sorted = [...kaminoRpcLatenciesMs].sort((a, b) => a - b);
  const total = kaminoRpcSuccess + kaminoRpcErrors;
  return {
    domain: KAMINO_DOMAIN,
    intelligenceVersion: KAMINO_INTELLIGENCE_VERSION,
    rpcLatencyMs: {
      p50: Math.round(percentileFromSorted(sorted, 50)),
      p95: Math.round(percentileFromSorted(sorted, 95)),
      sampleCount: sorted.length,
    },
    rpcErrorRate: total === 0 ? 0 : kaminoRpcErrors / total,
  };
}

export function resetDomainMetricsForTests(): void {
  kaminoRpcLatenciesMs.length = 0;
  kaminoRpcSuccess = 0;
  kaminoRpcErrors = 0;
}
