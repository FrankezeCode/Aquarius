/**
 * Aave contract addresses per chain.
 * TODO: Wire real contract addresses.
 */

import type { AaveChain } from "./chains";

export const AAVE_CONTRACTS: Record<AaveChain, Record<string, string>> = {
  ethereum: {
    pool: "",
    oracle: "",
  },
  arbitrum: {
    pool: "",
    oracle: "",
  },
  base: {
    pool: "",
    oracle: "",
  },
  polygon: {
    pool: "",
    oracle: "",
  },
};
