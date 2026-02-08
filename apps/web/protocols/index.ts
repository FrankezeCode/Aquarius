/**
 * Protocol resolution from explicit folders.
 * Thin router imports from here; fat modules live in each protocol folder.
 */

import type { ProtocolDefinition } from "./types";
import { aaveProtocol } from "./aave";
import { uniswapProtocol } from "./uniswap";
import { compoundProtocol } from "./compound";
import { lidoProtocol } from "./lido";

export const protocols: Record<string, ProtocolDefinition> = {
  aave: aaveProtocol,
  uniswap: uniswapProtocol,
  compound: compoundProtocol,
  lido: lidoProtocol,
};

export type ProtocolId = keyof typeof protocols;

export const protocolIds = Object.keys(protocols) as ProtocolId[];

export function getProtocol(id: string): ProtocolDefinition | undefined {
  return protocols[id];
}

export function isSupportedProtocol(id: string): id is ProtocolId {
  return id in protocols;
}

export type { ProtocolDefinition, ProtocolMetadata, ProtocolStatus } from "./types";
