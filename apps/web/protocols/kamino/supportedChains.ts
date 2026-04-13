/**
 * Kamino — Supported chains (Solana only for Phase A skeleton).
 *
 * Kamino is a distinct bounded context from Aave; do not reuse Aave chain lists.
 */

export const KAMINO_SUPPORTED_CHAINS = ["solana"] as const;

export type KaminoSupportedChain = (typeof KAMINO_SUPPORTED_CHAINS)[number];
