/**
 * Aave Protocol Module — Main exports
 */

// Metadata
export { metadata } from "./metadata";
export { AAVE_SUPPORTED_CHAINS, type AaveSupportedChain } from "./supportedChains";

// UI Components
export { AaveRiskMonitor, AaveOverview } from "./aave-risk-monitor";
export { AaveLayout } from "./layout";

// Web3
export * from "./web3/chains";
export * from "./web3/contracts";
export * from "./web3/adapters";

// Protocol definition
import type { ProtocolDefinition } from "../types";
import { metadata } from "./metadata";

export const aaveProtocol: ProtocolDefinition = {
  id: "aave",
  name: "Aave",
  metadata,
};
