/**
 * Compound Protocol Module — Main exports
 */

export { metadata } from "./metadata";
export { COMPOUND_SUPPORTED_CHAINS, type CompoundSupportedChain } from "./supportedChains";

// Web3
export * from "./web3/chains";
export * from "./web3/contracts";
export * from "./web3/adapters";

// Protocol definition
import type { ProtocolDefinition } from "../types";
import { metadata } from "./metadata";

export const compoundProtocol: ProtocolDefinition = {
  id: "compound",
  name: "Compound",
  metadata,
};
