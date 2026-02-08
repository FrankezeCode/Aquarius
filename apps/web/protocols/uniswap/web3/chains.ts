/**
 * Uniswap-supported chains.
 * TODO: Wire real chain config.
 */

export const UNISWAP_CHAINS = ["ethereum", "arbitrum", "base", "polygon"] as const;

export type UniswapChain = (typeof UNISWAP_CHAINS)[number];
