/**
 * Architecture manifest — versioned JSON for clients and external agents.
 * Describes trust boundaries; does not expose secrets.
 */

import type { RegisteredChain } from "./types.js";

const DEFAULT_CHAINS: RegisteredChain[] = [
  {
    id: "ethereum",
    displayName: "Ethereum",
    evmChainId: 1,
    maturity: "production_integrated",
  },
  {
    id: "polygon",
    displayName: "Polygon PoS",
    evmChainId: 137,
    maturity: "production_integrated",
  },
  {
    id: "arbitrum",
    displayName: "Arbitrum One",
    evmChainId: 42161,
    maturity: "production_integrated",
  },
  {
    id: "og_chain",
    displayName: "0G Chain (logical)",
    evmChainId: null,
    maturity: "advisory_schema_only",
  },
];

export function getRegisteredChains(): RegisteredChain[] {
  return DEFAULT_CHAINS;
}

export function getArchitectureManifest() {
  return {
    schemaVersion: 1,
    name: "aquarius-vault-gateway",
    layers: [
      {
        id: "edge",
        role: "Wallet and UI; user-signed transactions only.",
      },
      {
        id: "api",
        role: "Stateless public API (Zod, rate limits); no user private keys.",
      },
      {
        id: "orchestration",
        role: "CRE workflows and internal webhooks where consensus or scheduling is required.",
      },
      {
        id: "domain",
        role: "Risk and policy; pure logic without chain keys.",
      },
      {
        id: "execution",
        role: "Smart contracts and per-chain adapters for deposits, shares, and strategy allowlists.",
      },
      {
        id: "data",
        role: "RPC, indexers, validated protocol normalization.",
      },
    ],
    trustBoundaries: [
      "Intelligence APIs do not custody private keys.",
      "Yield and staking execution are on-chain or user-wallet scoped.",
      "This manifest and routing endpoint are advisory; they do not guarantee venue availability.",
    ],
    chains: getRegisteredChains(),
  };
}
