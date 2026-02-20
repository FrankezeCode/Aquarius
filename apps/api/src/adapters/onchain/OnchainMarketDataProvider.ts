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
import { DEFAULT_TARGET_ADDRESSES } from "../../infrastructure/aave/constants.js";

export class OnchainMarketDataProvider implements IMarketDataProvider {
  private reader: AaveContractReader;

  constructor(rpcUrl: string) {
    if (!rpcUrl) {
      throw new Error(
        "OnchainMarketDataProvider requires RPC_URL to be set."
      );
    }
    this.reader = new AaveContractReader(rpcUrl);
  }

  async fetchPositionSnapshots(
    chainId: string,
    limit: number
  ): Promise<PositionSnapshot[]> {
    console.info(
      `[onchain-provider] Fetching real Aave V3 positions from mainnet (chain=${chainId}, limit=${limit})`
    );

    const targetAddresses = DEFAULT_TARGET_ADDRESSES.slice(0, limit);

    const parsed = await this.reader.getPositionsForUsers(
      targetAddresses as string[]
    );

    const snapshots = toPositionSnapshots(parsed, chainId);

    console.info(
      `[onchain-provider] Found ${snapshots.length} active positions from ${targetAddresses.length} queried addresses`
    );

    return snapshots;
  }
}
