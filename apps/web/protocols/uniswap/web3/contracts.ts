/**
 * Uniswap contract addresses per chain.
 * TODO: Wire real contract addresses.
 */

import type { UniswapChain } from "./chains";

export const UNISWAP_CONTRACTS: Record<UniswapChain, Record<string, string>> = {
  ethereum: {
    router: "",
    factory: "",
  },
  arbitrum: {
    router: "",
    factory: "",
  },
  base: {
    router: "",
    factory: "",
  },
  polygon: {
    router: "",
    factory: "",
  },
};
