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
import { getDefaultTargetAddresses } from "../../infrastructure/aave/constants.js";

export class TenderlyMarketDataProvider implements IMarketDataProvider {
  private readonly rpcUrl: string;
  private readonly rpcUrlResolver?: (chainId: string) => string | null;

  constructor(rpcUrl: string, rpcUrlResolver?: (chainId: string) => string | null) {
    if (!rpcUrl) {
      throw new Error(
        "TenderlyMarketDataProvider requires TENDERLY_RPC_URL to be set."
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
      `[tenderly-provider] Fetching real Aave V3 positions from fork (chain=${chainId}, limit=${limit})`
    );

    const rpcUrl = this.rpcUrlResolver?.(chainId) ?? this.rpcUrl;
    const reader = new AaveContractReader(rpcUrl, chainId);
    const targetAddresses = getDefaultTargetAddresses(chainId).slice(0, limit);

    const parsed = await reader.getPositionsForUsers(
      targetAddresses as string[]
    );

    const snapshots = toPositionSnapshots(parsed, chainId);

    console.info(
      `[tenderly-provider] Found ${snapshots.length} active positions from ${targetAddresses.length} queried addresses`
    );

    return snapshots;
  }

  getReader(): AaveContractReader {
    return new AaveContractReader(this.rpcUrl, "ethereum");
  }

  getRpcUrl(): string {
    return this.rpcUrl;
  }
}
