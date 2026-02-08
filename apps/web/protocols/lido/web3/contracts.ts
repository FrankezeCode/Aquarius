/**
 * Lido contract addresses per chain.
 * TODO: Wire real contract addresses.
 */

import type { LidoChain } from "./chains";

export const LIDO_CONTRACTS: Record<LidoChain, Record<string, string>> = {
  ethereum: {
    stETH: "",
    wstETH: "",
  },
};
