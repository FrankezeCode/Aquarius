/**
 * Tenderly Virtual TestNet Market Data Provider
 *
 * Infrastructure adapter that reads real Aave V3 position data
 * via a Tenderly Virtual TestNet RPC endpoint using viem.
 *
 * This file is the ONLY place that knows about Tenderly.
 * Domain layer remains unaware of data source.
 *
 * Requires: TENDERLY_RPC_URL environment variable.
 */

import type { IMarketDataProvider } from "../../domain/ports/IMarketDataProvider.js";
import type { PositionSnapshot } from "../../domain/models/PositionSnapshot.js";
import { AaveContractReader } from "../../infrastructure/aave/AaveContractReader.js";
import { toPositionSnapshots } from "../../infrastructure/aave/mapper.js";
import { DEFAULT_TARGET_ADDRESSES } from "../../infrastructure/aave/constants.js";

export class TenderlyMarketDataProvider implements IMarketDataProvider {
  private reader: AaveContractReader;
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    if (!rpcUrl) {
      throw new Error(
        "TenderlyMarketDataProvider requires TENDERLY_RPC_URL to be set."
      );
    }
    this.rpcUrl = rpcUrl;
    this.reader = new AaveContractReader(rpcUrl);
  }

  async fetchPositionSnapshots(
    chainId: string,
    limit: number
  ): Promise<PositionSnapshot[]> {
    console.info(
      `[tenderly-provider] Fetching real Aave V3 positions from fork (chain=${chainId}, limit=${limit})`
    );

    const targetAddresses = DEFAULT_TARGET_ADDRESSES.slice(0, limit);

    const parsed = await this.reader.getPositionsForUsers(
      targetAddresses as string[]
    );

    const snapshots = toPositionSnapshots(parsed, chainId);

    console.info(
      `[tenderly-provider] Found ${snapshots.length} active positions from ${targetAddresses.length} queried addresses`
    );

    return snapshots;
  }

  getReader(): AaveContractReader {
    return this.reader;
  }

  getRpcUrl(): string {
    return this.rpcUrl;
  }
}
