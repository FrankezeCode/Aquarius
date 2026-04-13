/**
 * Chain Registry — Single source of truth for supported networks.
 *
 * EVM chains use EIP-155 `chainId`. Solana uses `family: "solana"` and `cluster`
 * (no EVM chainId — do not invent one).
 *
 * Adding a chain:
 * 1. Add entry to CHAINS below
 * 2. For EVM: create chain config at chains/{chainId}/ when needed
 * 3. Register in protocol supportedChains.ts where applicable
 *
 * @see docs/adr/0001-domains-and-boundaries.md
 */

/** EVM L1/L2 entry (MetaMask / ethers compatible). */
export type EvmChainDefinition = {
  family: "evm";
  id: string;
  name: string;
  chainId: number;
  color: string;
  symbol: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorer: string;
};

/** Solana cluster entry (non-EVM). */
export type SolanaChainDefinition = {
  family: "solana";
  id: "solana";
  name: string;
  cluster: "mainnet-beta" | "devnet" | "testnet";
  color: string;
  symbol: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorer: string;
};

export type ChainDefinition = EvmChainDefinition | SolanaChainDefinition;

export function isEvmChain(c: ChainDefinition): c is EvmChainDefinition {
  return c.family === "evm";
}

export const CHAINS: Record<string, ChainDefinition> = {
  ethereum: {
    family: "evm",
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    color: "#627EEA",
    symbol: "ETH",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://etherscan.io",
  },
  polygon: {
    family: "evm",
    id: "polygon",
    name: "Polygon",
    chainId: 137,
    color: "#8247E5",
    symbol: "POL",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    blockExplorer: "https://polygonscan.com",
  },
  arbitrum: {
    family: "evm",
    id: "arbitrum",
    name: "Arbitrum",
    chainId: 42161,
    color: "#28A0F0",
    symbol: "ARB",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://arbiscan.io",
  },
  optimism: {
    family: "evm",
    id: "optimism",
    name: "Optimism",
    chainId: 10,
    color: "#FF0420",
    symbol: "OP",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://optimistic.etherscan.io",
  },
  base: {
    family: "evm",
    id: "base",
    name: "Base",
    chainId: 8453,
    color: "#0052FF",
    symbol: "BASE",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://basescan.org",
  },
  bnb: {
    family: "evm",
    id: "bnb",
    name: "BNB Smart Chain",
    chainId: 56,
    color: "#F0B90B",
    symbol: "BNB",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    blockExplorer: "https://bscscan.com",
  },
  avalanche: {
    family: "evm",
    id: "avalanche",
    name: "Avalanche",
    chainId: 43114,
    color: "#E84142",
    symbol: "AVAX",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    blockExplorer: "https://snowtrace.io",
  },
  fantom: {
    family: "evm",
    id: "fantom",
    name: "Fantom",
    chainId: 250,
    color: "#1969FF",
    symbol: "FTM",
    nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 },
    blockExplorer: "https://ftmscan.com",
  },
  scroll: {
    family: "evm",
    id: "scroll",
    name: "Scroll",
    chainId: 534352,
    color: "#EDCF84",
    symbol: "SCR",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://scrollscan.com",
  },
  zksync: {
    family: "evm",
    id: "zksync",
    name: "ZkSync",
    chainId: 324,
    color: "#8C8DFC",
    symbol: "ZK",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://explorer.zksync.io",
  },
  linea: {
    family: "evm",
    id: "linea",
    name: "Linea",
    chainId: 59144,
    color: "#61DFFF",
    symbol: "LINEA",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://lineascan.build",
  },
  solana: {
    family: "solana",
    id: "solana",
    name: "Solana",
    cluster: "mainnet-beta",
    color: "#9945FF",
    symbol: "SOL",
    nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
    blockExplorer: "https://explorer.solana.com",
  },
};

export type ChainId = keyof typeof CHAINS;

export const chainIds = Object.keys(CHAINS) as ChainId[];

export function getChain(id: string): ChainDefinition | undefined {
  return CHAINS[id];
}

export function isSupportedChain(id: string): id is ChainId {
  return id in CHAINS;
}
