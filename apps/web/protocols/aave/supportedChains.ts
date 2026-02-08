/**
 * Aave — Supported Chains (declarative list)
 *
 * Order matters: first chain is the default for the navbar selector.
 * Adding a chain: append its registry ID here, then create adapter at adapters/aave/{chain}.ts
 */

export const AAVE_SUPPORTED_CHAINS = [
  "polygon",
  "ethereum",
  "arbitrum",
  "optimism",
  "base",
  "avalanche",
  "fantom",
  "scroll",
  "zksync",
  "linea",
  "bnb",
] as const;

export type AaveSupportedChain = (typeof AAVE_SUPPORTED_CHAINS)[number];
