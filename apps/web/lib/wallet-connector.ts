"use client";

import type { ChainDefinition } from "@/registry/chains";

export interface BrowserEthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
}

export type WalletErrorCode =
  | "provider_missing"
  | "user_rejected"
  | "request_pending"
  | "unsupported_chain"
  | "unknown";

export class WalletConnectorError extends Error {
  code: WalletErrorCode;
  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

function normalizeError(error: unknown): WalletConnectorError {
  const err = error as { code?: number; message?: string };
  if (err?.code === 4001) {
    return new WalletConnectorError(
      "user_rejected",
      "Wallet connection request was rejected."
    );
  }
  if (err?.code === -32002) {
    return new WalletConnectorError(
      "request_pending",
      "A wallet request is already pending in MetaMask."
    );
  }
  if (err?.code === 4902) {
    return new WalletConnectorError(
      "unsupported_chain",
      "Target chain is not configured in MetaMask."
    );
  }
  return new WalletConnectorError("unknown", err?.message ?? "Wallet operation failed.");
}

export function getWalletProvider(): BrowserEthereumProvider {
  const provider = (window as Window & { ethereum?: BrowserEthereumProvider }).ethereum;
  if (!provider) {
    throw new WalletConnectorError(
      "provider_missing",
      "MetaMask provider not found. Install or enable MetaMask."
    );
  }
  return provider;
}

export async function getActiveAccount(): Promise<string | null> {
  const provider = getWalletProvider();
  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[];
  return accounts[0] ?? null;
}

export async function getChainIdHex(): Promise<string> {
  const provider = getWalletProvider();
  return (await provider.request({ method: "eth_chainId" })) as string;
}

export async function connectWallet(): Promise<{
  account: string;
  chainIdHex: string;
}> {
  const provider = getWalletProvider();
  try {
    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];
    const account = accounts[0];
    if (!account) {
      throw new WalletConnectorError("unknown", "No wallet account returned by provider.");
    }
    const chainIdHex = await getChainIdHex();
    return { account, chainIdHex };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function switchOrAddChain(
  chain: ChainDefinition,
  options?: { rpcUrl?: string }
): Promise<void> {
  const provider = getWalletProvider();
  const chainIdHex = toHexChainId(chain.chainId);
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return;
  } catch (switchError) {
    const normalized = normalizeError(switchError);
    if (normalized.code !== "unsupported_chain") throw normalized;
  }

  const rpcUrls = options?.rpcUrl ? [options.rpcUrl] : undefined;
  if (!rpcUrls?.length) {
    throw new WalletConnectorError(
      "unsupported_chain",
      `Chain ${chain.name} is not configured in MetaMask.`
    );
  }

  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls,
          blockExplorerUrls: [chain.blockExplorer],
        },
      ],
    });
  } catch (error) {
    throw normalizeError(error);
  }
}

export function subscribeWalletEvents(input: {
  onAccountsChanged: (accounts: string[]) => void;
  onChainChanged: (chainIdHex: string) => void;
  onDisconnect?: () => void;
}): () => void {
  const provider = getWalletProvider();
  const handleAccounts = (accounts: unknown) =>
    input.onAccountsChanged(Array.isArray(accounts) ? (accounts as string[]) : []);
  const handleChain = (chainIdHex: unknown) =>
    input.onChainChanged(typeof chainIdHex === "string" ? chainIdHex : "");
  const handleDisconnect = () => input.onDisconnect?.();

  provider.on("accountsChanged", handleAccounts);
  provider.on("chainChanged", handleChain);
  provider.on("disconnect", handleDisconnect);

  return () => {
    provider.removeListener("accountsChanged", handleAccounts);
    provider.removeListener("chainChanged", handleChain);
    provider.removeListener("disconnect", handleDisconnect);
  };
}

export function hexToNumberChainId(chainIdHex: string): number {
  return Number.parseInt(chainIdHex, 16);
}

export async function assertWalletChainOrThrow(expectedChainId: number): Promise<void> {
  const chainIdHex = await getChainIdHex();
  const current = hexToNumberChainId(chainIdHex);
  if (current !== expectedChainId) {
    throw new WalletConnectorError(
      "unsupported_chain",
      `Wallet network mismatch. Expected chain ID ${expectedChainId}, got ${current}.`
    );
  }
}

export async function sendTransaction(input: {
  from: string;
  to: string;
  data?: string;
  valueHex?: string;
}): Promise<string> {
  const provider = getWalletProvider();
  try {
    const txHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: input.from,
          to: input.to,
          data: input.data ?? "0x",
          value: input.valueHex ?? "0x0",
        },
      ],
    })) as string;
    if (!txHash || typeof txHash !== "string") {
      throw new WalletConnectorError("unknown", "Wallet did not return a transaction hash.");
    }
    return txHash;
  } catch (error) {
    throw normalizeError(error);
  }
}

