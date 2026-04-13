/**
 * Protocol → Chain mapping — resolves which chains each protocol supports.
 *
 * This is the SINGLE authority for protocol-chain relationships.
 * The navbar, context, and adapters all read from here.
 *
 * Adding chain support:
 * 1. Add chain to registry/chains.ts
 * 2. Add chain ID to the protocol's supportedChains.ts
 * 3. Create adapter at adapters/{protocol}/{chain}.ts
 */

import { CHAINS, type ChainDefinition, type ChainId } from "./chains";
import { AAVE_SUPPORTED_CHAINS } from "@/protocols/aave/supportedChains";
import { COMPOUND_SUPPORTED_CHAINS } from "@/protocols/compound/supportedChains";
import { LIDO_SUPPORTED_CHAINS } from "@/protocols/lido/supportedChains";
import { UNISWAP_SUPPORTED_CHAINS } from "@/protocols/uniswap/supportedChains";
import { KAMINO_SUPPORTED_CHAINS } from "@/protocols/kamino/supportedChains";

/**
 * Maps protocol ID → ordered list of supported chain IDs.
 * First chain in the array is the default.
 */
const PROTOCOL_CHAIN_MAP: Record<string, readonly string[]> = {
  aave: AAVE_SUPPORTED_CHAINS,
  compound: COMPOUND_SUPPORTED_CHAINS,
  lido: LIDO_SUPPORTED_CHAINS,
  uniswap: UNISWAP_SUPPORTED_CHAINS,
  kamino: KAMINO_SUPPORTED_CHAINS,
};

/**
 * Get supported chains for a protocol as full ChainDefinition objects.
 */
export function getSupportedChains(protocolId: string): ChainDefinition[] {
  const chainIds = PROTOCOL_CHAIN_MAP[protocolId];
  if (!chainIds) return [];

  return chainIds
    .map((id) => CHAINS[id])
    .filter((c): c is ChainDefinition => c !== undefined);
}

/**
 * Get the default chain for a protocol (first in the supported list).
 */
export function getDefaultChain(protocolId: string): ChainDefinition | undefined {
  const chains = getSupportedChains(protocolId);
  return chains[0];
}

/**
 * Check if a specific chain is supported by a protocol.
 */
export function isChainSupportedByProtocol(
  protocolId: string,
  chainId: string
): boolean {
  const chainIds = PROTOCOL_CHAIN_MAP[protocolId];
  if (!chainIds) return false;
  return chainIds.includes(chainId);
}

/**
 * Get the supported chain IDs for a protocol.
 */
export function getSupportedChainIds(protocolId: string): readonly string[] {
  return PROTOCOL_CHAIN_MAP[protocolId] ?? [];
}

export type { ChainId };
