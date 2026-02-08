export type ChainId = "ethereum" | "arbitrum" | "solana" | "base";

export interface ProtocolEndpoint {
  chain: ChainId;
  path: string;
}
