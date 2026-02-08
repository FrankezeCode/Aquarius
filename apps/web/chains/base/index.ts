/**
 * Base Chain Config
 * TODO: Wire real RPC provider and chain-specific utilities.
 */

export const baseConfig = {
  chainId: 8453,
  name: "Base",
  rpcUrl: "", // Set via environment variable
} as const;
