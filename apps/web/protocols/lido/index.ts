/**
 * Lido Protocol Module — Main exports
 */

export { metadata } from "./metadata";
export { LIDO_SUPPORTED_CHAINS, type LidoSupportedChain } from "./supportedChains";

// Web3
export * from "./web3/chains";
export * from "./web3/contracts";
export * from "./web3/adapters";

// Protocol definition
import type { ProtocolDefinition } from "../types";
import { metadata } from "./metadata";

export const lidoProtocol: ProtocolDefinition = {
  id: "lido",
  name: "Lido",
  metadata,
};
