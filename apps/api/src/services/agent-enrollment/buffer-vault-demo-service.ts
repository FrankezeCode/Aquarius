import type { AaveActiveChain } from "../../routes/v1/aave-risk/chain.js";

export interface BufferVaultDemoPosition {
  walletAddress: string;
  chain: AaveActiveChain;
  asset: string;
  amount: number;
  estimatedApyPct: number;
  status: "insured_demo";
  receiptId: string;
  depositedAt: number;
  updatedAt: number;
}

function buildKey(walletAddress: string, chain: AaveActiveChain): string {
  return `${walletAddress.toLowerCase()}:${chain}`;
}

function estimateApyPct(asset: string): number {
  if (asset === "USDC" || asset === "USDT") return 4.8;
  if (asset === "WETH") return 3.2;
  return 4.0;
}

export class BufferVaultDemoService {
  private readonly positions = new Map<string, BufferVaultDemoPosition>();

  upsertDemoDeposit(input: {
    walletAddress: string;
    chain: AaveActiveChain;
    asset: string;
    amount: number;
  }): BufferVaultDemoPosition {
    const now = Date.now();
    const key = buildKey(input.walletAddress, input.chain);
    const existing = this.positions.get(key);
    const next: BufferVaultDemoPosition = {
      walletAddress: input.walletAddress,
      chain: input.chain,
      asset: input.asset,
      amount: input.amount,
      estimatedApyPct: estimateApyPct(input.asset),
      status: "insured_demo",
      receiptId: existing?.receiptId ?? `demo-${crypto.randomUUID()}`,
      depositedAt: existing?.depositedAt ?? now,
      updatedAt: now,
    };
    this.positions.set(key, next);
    return next;
  }

  getDemoPosition(
    walletAddress: string,
    chain: AaveActiveChain
  ): BufferVaultDemoPosition | null {
    const key = buildKey(walletAddress, chain);
    return this.positions.get(key) ?? null;
  }
}

import type { AaveActiveChain } from "../../routes/v1/aave-risk/chain.js";

export interface BufferVaultDemoPosition {
  walletAddress: string;
  chain: AaveActiveChain;
  asset: string;
  amount: number;
  estimatedApyPct: number;
  status: "insured_demo";
  receiptId: string;
  depositedAt: number;
  updatedAt: number;
}

function buildKey(walletAddress: string, chain: AaveActiveChain): string {
  return `${walletAddress.toLowerCase()}:${chain}`;
}

function estimateApyPct(asset: string): number {
  if (asset === "USDC" || asset === "USDT") return 4.8;
  if (asset === "WETH") return 3.2;
  return 4.0;
}

export class BufferVaultDemoService {
  private readonly positions = new Map<string, BufferVaultDemoPosition>();

  upsertDemoDeposit(input: {
    walletAddress: string;
    chain: AaveActiveChain;
    asset: string;
    amount: number;
  }): BufferVaultDemoPosition {
    const now = Date.now();
    const key = buildKey(input.walletAddress, input.chain);
    const existing = this.positions.get(key);
    const next: BufferVaultDemoPosition = {
      walletAddress: input.walletAddress,
      chain: input.chain,
      asset: input.asset,
      amount: input.amount,
      estimatedApyPct: estimateApyPct(input.asset),
      status: "insured_demo",
      receiptId: existing?.receiptId ?? `demo-${crypto.randomUUID()}`,
      depositedAt: existing?.depositedAt ?? now,
      updatedAt: now,
    };
    this.positions.set(key, next);
    return next;
  }

  getDemoPosition(
    walletAddress: string,
    chain: AaveActiveChain
  ): BufferVaultDemoPosition | null {
    const key = buildKey(walletAddress, chain);
    return this.positions.get(key) ?? null;
  }
}

