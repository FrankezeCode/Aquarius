/**
 * Kamino Protocol Module — Solana lending (bounded context).
 */

export { metadata } from "./metadata";
export {
  KAMINO_SUPPORTED_CHAINS,
  type KaminoSupportedChain,
} from "./supportedChains";

import type { ProtocolDefinition } from "../types";
import { metadata } from "./metadata";

export const kaminoProtocol: ProtocolDefinition = {
  id: "kamino",
  name: "Kamino",
  metadata,
};
