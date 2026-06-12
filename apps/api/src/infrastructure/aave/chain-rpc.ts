/**
 * Per-chain RPC resolution for Aave reads (Tenderly / onchain modes).
 */

const POLYGON = "polygon";
const ARBITRUM = "arbitrum";

export function resolveTenderlyRpcUrl(chainId: string): string | null {
  if (chainId === POLYGON) {
    return process.env.TENDERLY_RPC_URL_POLYGON ?? process.env.TENDERLY_RPC_URL ?? null;
  }
  if (chainId === ARBITRUM) {
    return (
      process.env.TENDERLY_RPC_URL_ARBITRUM ??
      process.env.TENDERLY_RPC_URL ??
      null
    );
  }
  return process.env.TENDERLY_RPC_URL_ETHEREUM ?? process.env.TENDERLY_RPC_URL ?? null;
}

export function resolveOnchainRpcUrl(chainId: string): string | null {
  if (chainId === POLYGON) {
    return process.env.RPC_URL_POLYGON ?? process.env.RPC_URL ?? null;
  }
  if (chainId === ARBITRUM) {
    return (
      process.env.RPC_URL_ARBITRUM ??
      process.env.ARBITRUM_RPC_URL ??
      process.env.RPC_URL ??
      null
    );
  }
  return process.env.RPC_URL_ETHEREUM ?? process.env.RPC_URL ?? null;
}
