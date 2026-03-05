/**
 * Domain Port — IMarketDataProvider
 *
 * The ONLY abstraction the domain layer depends on for market data.
 *
 * No ethers. No viem. No RPC URLs. No Tenderly types.
 * Domain defines the contract. Infrastructure implements it.
 */
import type { PositionSnapshot } from "../models/PositionSnapshot.js";
export interface IMarketDataProvider {
    fetchPositionSnapshots(chainId: string, limit: number): Promise<PositionSnapshot[]>;
}
//# sourceMappingURL=IMarketDataProvider.d.ts.map