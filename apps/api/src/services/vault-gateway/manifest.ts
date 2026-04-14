/**
 * Architecture manifest — versioned JSON for clients and external agents.
 * Describes trust boundaries; does not expose secrets.
 */

import { loadConfig } from "../../config/index.js";
import type {
  DelegationExecution,
  RegisteredChain,
} from "./types.js";

const DEFAULT_CHAINS: Array<Omit<RegisteredChain, "delegationExecution">> = [
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
    id: "sepolia",
    displayName: "Sepolia (testnet)",
    evmChainId: 11155111,
    maturity: "demo_simulation",
  },
  {
    id: "og_chain",
    displayName: "0G Chain (logical)",
    evmChainId: null,
    maturity: "advisory_schema_only",
  },
];

function delegationExecutionForChain(chainId: string): DelegationExecution {
  const cfg = loadConfig();
  if (chainId === "og_chain") return "unavailable";
  if (cfg.posDelegationEnabledChains.has(chainId)) return "live_staged";
  return "advisory";
}

export function getRegisteredChains(): RegisteredChain[] {
  return DEFAULT_CHAINS.map((c) => ({
    ...c,
    delegationExecution: delegationExecutionForChain(c.id),
  }));
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
      "Curated PoS delegation via the API is gated per chain (`delegationExecution`); operator keys are never exposed to clients.",
    ],
    chains: getRegisteredChains(),
  };
}
