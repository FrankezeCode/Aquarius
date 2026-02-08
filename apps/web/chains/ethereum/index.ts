/**
 * Ethereum Chain Config
 * TODO: Wire real RPC provider and chain-specific utilities.
 */

export const ethereumConfig = {
  chainId: 1,
  name: "Ethereum",
  rpcUrl: "", // Set via environment variable
} as const;
