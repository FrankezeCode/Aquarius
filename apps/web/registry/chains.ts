/**
 * Chain Registry — Single source of truth for all supported blockchain networks.
 *
 * Adding a new chain:
 * 1. Add entry to CHAINS below
 * 2. Create chain config folder at chains/{chainId}/
 * 3. Register in protocol supportedChains.ts where applicable
 */

export interface ChainDefinition {
  id: string;
  name: string;
  chainId: number;
  color: string;
  symbol: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorer: string;
}

export const CHAINS: Record<string, ChainDefinition> = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    color: "#627EEA",
    symbol: "ETH",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://etherscan.io",
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    chainId: 137,
    color: "#8247E5",
    symbol: "POL",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    blockExplorer: "https://polygonscan.com",
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum",
    chainId: 42161,
    color: "#28A0F0",
    symbol: "ARB",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://arbiscan.io",
  },
  optimism: {
    id: "optimism",
    name: "Optimism",
    chainId: 10,
    color: "#FF0420",
    symbol: "OP",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://optimistic.etherscan.io",
  },
  base: {
    id: "base",
    name: "Base",
    chainId: 8453,
    color: "#0052FF",
    symbol: "BASE",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://basescan.org",
  },
  bnb: {
    id: "bnb",
    name: "BNB Smart Chain",
    chainId: 56,
    color: "#F0B90B",
    symbol: "BNB",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    blockExplorer: "https://bscscan.com",
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche",
    chainId: 43114,
    color: "#E84142",
    symbol: "AVAX",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    blockExplorer: "https://snowtrace.io",
  },
  fantom: {
    id: "fantom",
    name: "Fantom",
    chainId: 250,
    color: "#1969FF",
    symbol: "FTM",
    nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 },
    blockExplorer: "https://ftmscan.com",
  },
  scroll: {
    id: "scroll",
    name: "Scroll",
    chainId: 534352,
    color: "#EDCF84",
    symbol: "SCR",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://scrollscan.com",
  },
  zksync: {
    id: "zksync",
    name: "ZkSync",
    chainId: 324,
    color: "#8C8DFC",
    symbol: "ZK",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://explorer.zksync.io",
  },
  linea: {
    id: "linea",
    name: "Linea",
    chainId: 59144,
    color: "#61DFFF",
    symbol: "LINEA",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://lineascan.build",
  },
} as const;

export type ChainId = keyof typeof CHAINS;

export const chainIds = Object.keys(CHAINS) as ChainId[];

export function getChain(id: string): ChainDefinition | undefined {
  return CHAINS[id];
}

export function isSupportedChain(id: string): id is ChainId {
  return id in CHAINS;
}
