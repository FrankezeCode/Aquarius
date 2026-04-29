"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface CopilotTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotResponse {
  mode: "informational";
  answer: string;
  whatItMeans: string;
  recommendedActions: string[];
  confidence: number;
  limits: string[];
  disclaimer: string;
  contextTimestamp: number;
  schemaVersion: "v1";
  fallbackUsed?: boolean;
}

export function useRiskCopilot(params: {
  protocol: "aave" | "kamino";
  chain: string;
  walletAddress?: string;
  /** Kamino: forwarded to /copilot/chat as snapshotContext. */
  snapshotContext?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<CopilotTurn[]>([]);
  const [lastResponse, setLastResponse] = useState<CopilotResponse | null>(null);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const nextConversation = [
        ...conversation,
        { role: "user" as const, content: trimmed },
      ];
      setConversation(nextConversation);
      setError(null);
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/copilot/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            protocol: params.protocol,
            chain: params.chain,
            walletAddress: params.walletAddress,
            snapshotContext: params.snapshotContext,
            question: trimmed,
            conversation: nextConversation.slice(-8),
          }),
        });
        if (!res.ok) {
          let message = `Copilot request failed: ${res.status}`;
          try {
            const err = (await res.json()) as { message?: string };
            if (err?.message) message = err.message;
          } catch {
            // keep generic message
          }
          throw new Error(message);
        }
        const data = (await res.json()) as CopilotResponse;
        setLastResponse(data);
        setConversation((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, params.chain, params.protocol, params.walletAddress, params.snapshotContext]
  );

  const reset = useCallback(() => {
    setConversation([]);
    setLastResponse(null);
    setError(null);
  }, []);

  return {
    ask,
    reset,
    isLoading,
    error,
    conversation,
    lastResponse,
  };
}

