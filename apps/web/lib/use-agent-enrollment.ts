"use client";

import useSWR from "swr";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    let message = `Agent enrollment fetch failed: ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // keep generic fallback
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export type AgentEnrollmentMode =
  | "alert_only"
  | "mitigate_agent"
  | "buffer_vault";

export interface AgentEnrollmentRecord {
  walletAddress: string;
  chain: string;
  mode: AgentEnrollmentMode;
  channels: {
    telegram?: string;
    webhook?: string;
  };
  displayName?: string;
  status: "active" | "inactive";
  policyBindingStatus:
    | "pending_onchain"
    | "signing_requested"
    | "pending_tx"
    | "bound_onchain"
    | "bind_failed";
  policyBindingRef: string | null;
  bindingChainId: number | null;
  bindingError: string | null;
  lastBindingAttemptAt: number | null;
  lastBindingIdempotencyKey: string | null;
  deactivationTxRef: string | null;
  deactivatedAt: number | null;
  deactivationError: string | null;
  lastDeactivationAttemptAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface AgentEnrollmentInput {
  walletAddress: string;
  chain: string;
  mode: AgentEnrollmentMode;
  telegram?: string;
  webhook?: string;
  displayName?: string;
}

export interface BindIntentInput {
  walletAddress: string;
  chain: string;
  chainId: number;
  idempotencyKey: string;
  mode?: AgentEnrollmentMode;
  telegram?: string;
  webhook?: string;
  displayName?: string;
}

export interface BindIntentResponse {
  walletAddress: string;
  chain: string;
  chainId: number;
  idempotencyKey: string;
  contractAddress: string;
  record: AgentEnrollmentRecord;
}

export interface ConfirmBindInput {
  walletAddress: string;
  chain: string;
  chainId: number;
  idempotencyKey: string;
  txHash?: string;
  error?: string;
  finalStatus?: "pending_tx" | "bound_onchain" | "bind_failed";
}

export interface DeactivateIntentInput {
  walletAddress: string;
  chain: string;
  chainId: number;
  idempotencyKey: string;
}

export interface ConfirmDeactivateInput {
  walletAddress: string;
  chain: string;
  chainId: number;
  idempotencyKey: string;
  txHash?: string;
  error?: string;
}

export interface BufferVaultDemoDepositInput {
  walletAddress: string;
  chain: string;
  asset: string;
  amount: number;
}

export interface BufferVaultDemoPosition {
  walletAddress: string;
  chain: string;
  asset: string;
  amount: number;
  estimatedApyPct: number;
  status: "insured_demo";
  receiptId: string;
  depositedAt: number;
  updatedAt: number;
}

export function useAgentEnrollment(
  walletAddress: string | null,
  chain: string = "ethereum"
) {
  const { data, error, isLoading, mutate } = useSWR<AgentEnrollmentRecord>(
    walletAddress
      ? `/api/v1/agent-enrollment/${walletAddress}?chain=${encodeURIComponent(chain)}`
      : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 4_000,
    }
  );

  async function upsertEnrollment(
    payload: AgentEnrollmentInput
  ): Promise<AgentEnrollmentRecord> {
    const res = await fetch(`${API_BASE}/api/v1/agent-enrollment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await res.json()) as AgentEnrollmentRecord & { message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `Enrollment request failed: ${res.status}`);
    }
    await mutate(body, { revalidate: false });
    return body;
  }

  async function beginBindingIntent(
    payload: BindIntentInput
  ): Promise<BindIntentResponse> {
    const res = await fetch(`${API_BASE}/api/v1/agent-enrollment/bind-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as BindIntentResponse & { message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `Bind intent failed: ${res.status}`);
    }
    await mutate(body.record, { revalidate: false });
    return body;
  }

  async function confirmBinding(
    payload: ConfirmBindInput
  ): Promise<AgentEnrollmentRecord> {
    const res = await fetch(`${API_BASE}/api/v1/agent-enrollment/confirm-bind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as AgentEnrollmentRecord & { message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `Confirm bind failed: ${res.status}`);
    }
    await mutate(body, { revalidate: false });
    return body;
  }

  async function beginDeactivationIntent(
    payload: DeactivateIntentInput
  ): Promise<BindIntentResponse> {
    const res = await fetch(`${API_BASE}/api/v1/agent-enrollment/deactivate-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as BindIntentResponse & { message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `Deactivate intent failed: ${res.status}`);
    }
    await mutate(body.record, { revalidate: false });
    return body;
  }

  async function confirmDeactivation(
    payload: ConfirmDeactivateInput
  ): Promise<AgentEnrollmentRecord> {
    const res = await fetch(`${API_BASE}/api/v1/agent-enrollment/confirm-deactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as AgentEnrollmentRecord & { message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `Confirm deactivate failed: ${res.status}`);
    }
    await mutate(body, { revalidate: false });
    return body;
  }

  async function depositBufferVaultDemo(
    payload: BufferVaultDemoDepositInput
  ): Promise<BufferVaultDemoPosition> {
    const res = await fetch(`${API_BASE}/api/v1/agent-enrollment/buffer-vault/deposit-demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as BufferVaultDemoPosition & { message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `Buffer vault demo deposit failed: ${res.status}`);
    }
    return body;
  }

  async function getBufferVaultDemoPosition(
    queryWalletAddress: string,
    queryChain: string = chain
  ): Promise<BufferVaultDemoPosition> {
    const res = await fetch(
      `${API_BASE}/api/v1/agent-enrollment/buffer-vault/${queryWalletAddress}?chain=${encodeURIComponent(queryChain)}`
    );
    const body = (await res.json()) as BufferVaultDemoPosition & { message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `Buffer vault demo fetch failed: ${res.status}`);
    }
    return body;
  }

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
    upsertEnrollment,
    beginBindingIntent,
    confirmBinding,
    beginDeactivationIntent,
    confirmDeactivation,
    depositBufferVaultDemo,
    getBufferVaultDemoPosition,
    notFound: Boolean(
      error instanceof Error && error.message.toLowerCase().includes("not found")
    ),
  };
}

