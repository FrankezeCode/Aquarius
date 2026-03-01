"use client";

import type { AgentEnrollmentMode } from "./use-agent-enrollment";
import {
  WalletConnectorError,
  assertWalletChainOrThrow,
  getWalletProvider,
  sendTransaction,
} from "./wallet-connector";

export interface PolicyIntentInput {
  walletAddress: string;
  chain: string;
  chainId: number;
  mode: AgentEnrollmentMode;
  displayName?: string;
  telegram?: string;
  webhook?: string;
}

export interface PolicyIntentResult {
  status: "bound_onchain" | "pending_onchain";
  reason: "phase_b_tx_submitted" | "phase_a_fallback";
  txHash: string | null;
  idempotencyKey: string;
  chainId: number;
}

export interface DeactivatePolicyIntentInput {
  walletAddress: string;
  chain: string;
  chainId: number;
}

export interface DeactivatePolicyIntentResult {
  status: "deactivated_onchain" | "deactivated_offchain";
  reason: "phase_b_tx_submitted" | "phase_a_fallback";
  txHash: string | null;
  idempotencyKey: string;
  chainId: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface BindIntentResponse {
  walletAddress: string;
  chain: string;
  chainId: number;
  idempotencyKey: string;
  contractAddress: string;
}

function isPhaseBEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PHASE_B_POLICY_BINDING === "1";
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed: ${response.status}`);
  }
  return payload;
}

export async function signPolicyIntent(input: PolicyIntentInput): Promise<PolicyIntentResult> {
  const idempotencyKey = crypto.randomUUID();
  if (!isPhaseBEnabled()) {
    return {
      status: "pending_onchain",
      reason: "phase_a_fallback",
      txHash: null,
      idempotencyKey,
      chainId: input.chainId,
    };
  }

  try {
    getWalletProvider();
    await assertWalletChainOrThrow(input.chainId);

    const bindIntent = await postJson<BindIntentResponse>(
      "/api/v1/agent-enrollment/bind-intent",
      {
        walletAddress: input.walletAddress,
        chain: input.chain,
        chainId: input.chainId,
        idempotencyKey,
        mode: input.mode,
        displayName: input.displayName,
        telegram: input.telegram,
        webhook: input.webhook,
      }
    );

    const txHash = await sendTransaction({
      from: input.walletAddress,
      to: bindIntent.contractAddress,
      data: "0x",
      valueHex: "0x0",
    });

    await postJson("/api/v1/agent-enrollment/confirm-bind", {
      walletAddress: input.walletAddress,
      chain: input.chain,
      chainId: input.chainId,
      idempotencyKey,
      txHash,
      finalStatus: "bound_onchain",
    });

    return {
      status: "bound_onchain",
      reason: "phase_b_tx_submitted",
      txHash,
      idempotencyKey,
      chainId: input.chainId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await fetch(`${API_BASE}/api/v1/agent-enrollment/confirm-bind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: input.walletAddress,
        chain: input.chain,
        chainId: input.chainId,
        idempotencyKey,
        error: message,
        finalStatus: "bind_failed",
      }),
    }).catch(() => undefined);

    if (error instanceof WalletConnectorError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function deactivatePolicyIntent(
  input: DeactivatePolicyIntentInput
): Promise<DeactivatePolicyIntentResult> {
  const idempotencyKey = crypto.randomUUID();
  if (!isPhaseBEnabled()) {
    await postJson("/api/v1/agent-enrollment/confirm-deactivate", {
      walletAddress: input.walletAddress,
      chain: input.chain,
      chainId: input.chainId,
      idempotencyKey,
    });

    return {
      status: "deactivated_offchain",
      reason: "phase_a_fallback",
      txHash: null,
      idempotencyKey,
      chainId: input.chainId,
    };
  }

  getWalletProvider();
  await assertWalletChainOrThrow(input.chainId);

  const deactivateIntent = await postJson<BindIntentResponse>(
    "/api/v1/agent-enrollment/deactivate-intent",
    {
      walletAddress: input.walletAddress,
      chain: input.chain,
      chainId: input.chainId,
      idempotencyKey,
    }
  );

  try {
    const txHash = await sendTransaction({
      from: input.walletAddress,
      to: deactivateIntent.contractAddress,
      data: "0x",
      valueHex: "0x0",
    });

    await postJson("/api/v1/agent-enrollment/confirm-deactivate", {
      walletAddress: input.walletAddress,
      chain: input.chain,
      chainId: input.chainId,
      idempotencyKey,
      txHash,
    });

    return {
      status: "deactivated_onchain",
      reason: "phase_b_tx_submitted",
      txHash,
      idempotencyKey,
      chainId: input.chainId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await fetch(`${API_BASE}/api/v1/agent-enrollment/confirm-deactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: input.walletAddress,
        chain: input.chain,
        chainId: input.chainId,
        idempotencyKey,
        error: message,
      }),
    }).catch(() => undefined);
    throw error;
  }
}

