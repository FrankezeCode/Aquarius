/**
 * Lido — Supported Chains (declarative list)
 *
 * Order matters: first chain is the default for the navbar selector.
 */

export const LIDO_SUPPORTED_CHAINS = [
  "ethereum",
] as const;

export type LidoSupportedChain = (typeof LIDO_SUPPORTED_CHAINS)[number];
