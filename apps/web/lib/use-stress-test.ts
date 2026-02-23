"use client";

import useSWR from "swr";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetcher(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export interface StressScenarioResult {
  name: string;
  projectedHF: number;
  lossUsd: number;
  wouldLiquidate: boolean;
}

export interface StressTestData {
  user: string;
  currentHF: number;
  scenarios: StressScenarioResult[];
  interpretation: string;
  action: string;
  timestamp: number;
}

export function useStressTest(userAddress: string | null) {
  const { data, error, isLoading } = useSWR<StressTestData>(
    userAddress ? `/api/v1/aave-risk/stress-test/${userAddress}` : null,
    fetcher,
    { refreshInterval: 30_000, dedupingInterval: 10_000 },
  );

  return { data: data ?? null, error, isLoading };
}
