/**
 * Lido-supported chains.
 * TODO: Wire real chain config.
 */

export const LIDO_CHAINS = ["ethereum"] as const;

export type LidoChain = (typeof LIDO_CHAINS)[number];
