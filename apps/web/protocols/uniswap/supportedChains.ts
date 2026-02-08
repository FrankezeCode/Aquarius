/**
 * Uniswap — Supported Chains (declarative list)
 *
 * Order matters: first chain is the default for the navbar selector.
 */

export const UNISWAP_SUPPORTED_CHAINS = [
  "ethereum",
  "arbitrum",
  "base",
  "polygon",
] as const;

export type UniswapSupportedChain = (typeof UNISWAP_SUPPORTED_CHAINS)[number];
