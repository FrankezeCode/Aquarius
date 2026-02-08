/**
 * Compound contract addresses per chain.
 * TODO: Wire real contract addresses.
 */

import type { CompoundChain } from "./chains";

export const COMPOUND_CONTRACTS: Record<CompoundChain, Record<string, string>> = {
  ethereum: {
    comptroller: "",
    cETH: "",
  },
  arbitrum: {
    comptroller: "",
  },
  base: {
    comptroller: "",
  },
};
