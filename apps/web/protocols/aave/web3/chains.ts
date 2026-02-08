/**
 * Aave-supported chains.
 * TODO: Wire real chain config (chain IDs, RPC URLs, etc.)
 */

export const AAVE_CHAINS = ["ethereum", "arbitrum", "base", "polygon"] as const;

export type AaveChain = (typeof AAVE_CHAINS)[number];
