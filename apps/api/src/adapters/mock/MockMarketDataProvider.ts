/**
 * Mock Market Data Provider
 *
 * Infrastructure adapter that generates synthetic position data
 * for local development and testing.
 *
 * Extracted from the original mockPositions() in
 * protocols/aave/risk-intelligence/signals.ts.
 */

import type { IMarketDataProvider } from "../../domain/ports/IMarketDataProvider.js";
import type { PositionSnapshot } from "../../domain/models/PositionSnapshot.js";

export class MockMarketDataProvider implements IMarketDataProvider {
  async fetchPositionSnapshots(
    chainId: string,
    limit: number
  ): Promise<PositionSnapshot[]> {
    const now = Date.now();

    return Array.from({ length: limit }, (_, i) => {
      const hf = 1.0 + Math.random() * 2.5;
      const collateral = 5_000 + Math.random() * 95_000;
      const debt = collateral / hf;

      return {
        owner: `0x${chainId.slice(0, 4)}${"0".repeat(36)}${String(i).padStart(4, "0")}`,
        chainId,
        protocol: "aave",
        healthFactor: Math.round(hf * 1000) / 1000,
        collateralUsd: Math.round(collateral * 100) / 100,
        debtUsd: Math.round(debt * 100) / 100,
        liquidationProximity: Math.round(((hf - 1) / hf) * 10000) / 100,
        timestamp: now,
      };
    });
  }
}
