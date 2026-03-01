"use client";

import useSWR from "swr";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const POLL_INTERVAL_MS = 30_000;

export interface ApiFetchError extends Error {
  status?: number;
  body?: unknown;
}

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    const err = new Error(`Health score fetch failed: ${res.status}`) as ApiFetchError;
    err.status = res.status;
    err.body = body;
    throw err;
  }
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
  healthFactor?: number;
  liquidationDistancePct?: number;
  healthFactorDirection?: "up" | "down" | "neutral";
  mostExposedAsset?: string;
  agentRecommendation?: string;
}

export interface UserRiskData {
  user: string;
  protocol: string;
  score: number;
  category: "stable" | "watch" | "high_risk";
  confidence: number;
  reasoning: string;
  regime?: "normal" | "elevated" | "stressed";
  dominantRisk?: string;
  healthFactor: number;
  healthFactorDirection: "up" | "down" | "neutral";
  liquidationDistancePct: number;
  mostExposedAsset: string;
  agentRecommendation: string;
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

export function useUserHealth(address: string | null, chain: string = "ethereum") {
  const { data, error, isLoading, mutate } = useSWR<UserHealthData>(
    address
      ? `/api/v1/aave-risk/user-health/${address}?chain=${encodeURIComponent(chain)}`
      : null,
    fetcher,
    {
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    }
  );

  return { data, error, isLoading, refresh: mutate };
}

export function useUserRisk(address: string | null, chain: string = "ethereum") {
  const { data, error, isLoading, mutate } = useSWR<UserRiskData>(
    address
      ? `/api/v1/aave-risk/user-risk/${address}?chain=${encodeURIComponent(chain)}`
      : null,
    fetcher,
    {
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    }
  );

  const notFound = Boolean((error as ApiFetchError | undefined)?.status === 404);

  return { data, error, isLoading, refresh: mutate, notFound };
}
