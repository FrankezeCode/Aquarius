/**
 * Optimism Chain Config
 * TODO: Wire real RPC provider and chain-specific utilities.
 */

export const optimismConfig = {
  chainId: 10,
  name: "Optimism",
  rpcUrl: "", // Set via environment variable
} as const;
