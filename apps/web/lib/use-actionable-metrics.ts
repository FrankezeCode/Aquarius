"use client";

import useSWR from "swr";
import type { ActionableMetric } from "@/components/aave-risk-monitor/actionable-metric-card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetcher(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

interface ActionableMetricsResponse {
  metrics: ActionableMetric[];
  timestamp: number;
}

export function useActionableMetrics(chain: string = "ethereum") {
  const { data, error, isLoading } = useSWR<ActionableMetricsResponse>(
    `/api/v1/aave-risk/actionable-metrics?chain=${encodeURIComponent(chain)}`,
    fetcher,
    { refreshInterval: 10_000, dedupingInterval: 5_000 },
  );

  return { data: data?.metrics ?? null, error, isLoading };
}
