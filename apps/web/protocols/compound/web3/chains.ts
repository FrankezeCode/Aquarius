/**
 * Compound-supported chains.
 * TODO: Wire real chain config.
 */

export const COMPOUND_CHAINS = ["ethereum", "arbitrum", "base"] as const;

export type CompoundChain = (typeof COMPOUND_CHAINS)[number];
