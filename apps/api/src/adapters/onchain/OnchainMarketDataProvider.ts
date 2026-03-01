/**
 * On-chain (Mainnet) Market Data Provider
 *
 * Infrastructure adapter that reads real Aave V3 position data
 * directly from mainnet (or any live chain) via standard RPC.
 *
 * Uses the same AaveContractReader as TenderlyMarketDataProvider.
 * Only the RPC endpoint differs.
 *
 * Requires: RPC_URL environment variable.
 */

import type { IMarketDataProvider } from "../../domain/ports/IMarketDataProvider.js";
import type { PositionSnapshot } from "../../domain/models/PositionSnapshot.js";
import { AaveContractReader } from "../../infrastructure/aave/AaveContractReader.js";
import { toPositionSnapshots } from "../../infrastructure/aave/mapper.js";
import { getDefaultTargetAddresses } from "../../infrastructure/aave/constants.js";

export class OnchainMarketDataProvider implements IMarketDataProvider {
  private readonly rpcUrl: string;
  private readonly rpcUrlResolver?: (chainId: string) => string | null;

  constructor(rpcUrl: string, rpcUrlResolver?: (chainId: string) => string | null) {
    if (!rpcUrl) {
      throw new Error(
        "OnchainMarketDataProvider requires RPC_URL to be set."
      );
    }
    this.rpcUrl = rpcUrl;
    this.rpcUrlResolver = rpcUrlResolver;
  }

  async fetchPositionSnapshots(
    chainId: string,
    limit: number
  ): Promise<PositionSnapshot[]> {
    console.info(
      `[onchain-provider] Fetching real Aave V3 positions from mainnet (chain=${chainId}, limit=${limit})`
    );

    const rpcUrl = this.rpcUrlResolver?.(chainId) ?? this.rpcUrl;
    const reader = new AaveContractReader(rpcUrl, chainId);
    const targetAddresses = getDefaultTargetAddresses(chainId).slice(0, limit);

    const parsed = await reader.getPositionsForUsers(
      targetAddresses as string[]
    );

    const snapshots = toPositionSnapshots(parsed, chainId);

    console.info(
      `[onchain-provider] Found ${snapshots.length} active positions from ${targetAddresses.length} queried addresses`
    );

    return snapshots;
  }
}
