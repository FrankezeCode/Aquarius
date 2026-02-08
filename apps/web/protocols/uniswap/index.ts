/**
 * Uniswap Protocol Module — Main exports
 */

export { metadata } from "./metadata";
export { UNISWAP_SUPPORTED_CHAINS, type UniswapSupportedChain } from "./supportedChains";

// Web3
export * from "./web3/chains";
export * from "./web3/contracts";
export * from "./web3/adapters";

// Protocol definition
import type { ProtocolDefinition } from "../types";
import { metadata } from "./metadata";

export const uniswapProtocol: ProtocolDefinition = {
  id: "uniswap",
  name: "Uniswap",
  metadata,
};
