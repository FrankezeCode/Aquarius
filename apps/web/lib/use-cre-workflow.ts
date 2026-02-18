"use client";

import useSWR from "swr";

const CRE_ENDPOINT = "/api/cre/run";
const POLL_INTERVAL_MS = 5_000;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetcher(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`CRE fetch failed: ${res.status}`);
  return res.json();
}

export interface CREWorkflowData {
  protocolStatus: "stable" | "watch" | "high-risk";
  riskScore: {
    composite: number;
    level: string;
    summary: string;
    dimensions: Array<{ label: string; value: number; weight: number }>;
    sampleSize: number;
  };
  riskFactors: Array<{
    id: string;
    label: string;
    value: string;
    direction?: "up" | "down" | "neutral";
  }>;
  riskProgression: {
    infoCount: number;
    confirmCount: number;
    invalidateCount: number;
    activeStage: "info" | "confirm" | "invalidate";
  };
  agentDecision: {
    decision: string;
    confidence: number;
    actionsRequested: string[];
    blackSwanDetected: boolean;
  };
  llmReasoning?: {
    action: string;
    confidence: number;
    reason: string;
  };
  actionDispatch: {
    dispatched: string[];
  };
  latencies: {
    risk: number;
    agent: number;
    llm?: number;
    action: number;
    total: number;
  };
  events: Array<{
    id: string;
    timestamp: string;
    message: string;
    severity: "info" | "warning" | "critical";
  }>;
  timestamp: number;
}

export function useCREWorkflow() {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<CREWorkflowData>(CRE_ENDPOINT, fetcher, {
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
      dedupingInterval: 2_000,
    });

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh: mutate,
  };
}
