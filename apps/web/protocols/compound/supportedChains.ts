/**
 * Compound — Supported Chains (declarative list)
 *
 * Order matters: first chain is the default for the navbar selector.
 */

export const COMPOUND_SUPPORTED_CHAINS = [
  "ethereum",
  "arbitrum",
  "base",
] as const;

export type CompoundSupportedChain = (typeof COMPOUND_SUPPORTED_CHAINS)[number];
