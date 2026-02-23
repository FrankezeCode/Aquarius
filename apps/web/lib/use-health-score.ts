"use client";

import useSWR from "swr";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const POLL_INTERVAL_MS = 30_000;

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Health score fetch failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface ProtocolHealthData {
  protocol: string;
  score: number;
  category: "stable" | "watch" | "high_risk";
  confidence: number;
  breakdown: {
    liquidity: number;
    riskConcentration: number;
    liquidationRisk: number;
    smartContractRisk: number;
  };
  reasoning: string;
  regime?: "normal" | "elevated" | "stressed";
  dominantRisk?: string;
  metadata: {
    block: number | null;
    timestamp: string;
    sources: string[];
  };
}

export interface UserHealthData {
  user: string;
  protocol: string;
  score: number;
  category: "stable" | "watch" | "high_risk";
  confidence: number;
  base: number;
  penalties: {
    volatility: number;
    concentration: number;
    correlation: number;
  };
  reasoning: string;
  regime?: "normal" | "elevated" | "stressed";
  dominantRisk?: string;
  metadata: {
    block: number | null;
    timestamp: string;
    sources: string[];
  };
}

export function useProtocolHealth(protocol: string = "aave", chain: string = "ethereum") {
  const { data, error, isLoading, mutate } = useSWR<ProtocolHealthData>(
    `/api/v1/aave-risk/protocol-health/${chain}`,
    fetcher,
    {
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    }
  );

  return { data, error, isLoading, refresh: mutate };
}

export function useUserHealth(address: string | null) {
  const { data, error, isLoading, mutate } = useSWR<UserHealthData>(
    address ? `/api/v1/aave-risk/user-health/${address}` : null,
    fetcher,
    {
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    }
  );

  return { data, error, isLoading, refresh: mutate };
}
