/**
 * Application ports — Kamino on Solana (bounded context).
 *
 * Infrastructure implements these with RPC + Kamino SDK; no Solana URLs here.
 *
 * @see docs/adr/0001-domains-and-boundaries.md
 */

import type { AquariusDomainId } from "@aquarius/types";

export type KaminoCluster = "mainnet-beta" | "devnet" | "testnet";

/**
 * Normalized position snapshot for the Kamino domain (stub fields until RPC ingestion).
 */
export interface KaminoPositionSnapshot {
  readonly domain: Extract<AquariusDomainId, "kamino-solana">;
  readonly cluster: KaminoCluster;
  /** Solana base58 address */
  readonly owner: string;
  readonly placeholder: true;
}

/**
 * Read Kamino lending markets (implementation in infrastructure layer).
 */
export interface KaminoMarketReader {
  listMarketLabels(): Promise<readonly string[]>;
}
