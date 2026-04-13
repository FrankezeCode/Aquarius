/**
 * Single process-local Solana JSON-RPC client (@solana/kit) for Kamino reads.
 */

import { createSolanaRpc, type Rpc } from "@solana/kit";

let cachedUrl: string | null = null;
let cachedRpc: Rpc<unknown> | null = null;

export function getSolanaRpcForUrl(rpcUrl: string): Rpc<unknown> {
  if (cachedRpc && cachedUrl === rpcUrl) {
    return cachedRpc;
  }
  cachedUrl = rpcUrl;
  cachedRpc = createSolanaRpc(rpcUrl) as Rpc<unknown>;
  return cachedRpc;
}

export function resetSolanaRpcCacheForTests(): void {
  cachedUrl = null;
  cachedRpc = null;
}
