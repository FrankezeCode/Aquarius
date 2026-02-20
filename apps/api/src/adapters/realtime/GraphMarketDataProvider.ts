/**
 * Real-Time Market Data Provider
 *
 * Infrastructure adapter that reads from the in-memory position graph
 * maintained by the event engine's WSS streams.
 *
 * Implements IMarketDataProvider so it plugs seamlessly into
 * runCREWorkflow() and all existing domain logic.
 *
 * Zero network calls. Sub-millisecond reads.
 * Requires the event engine to be running and populating the graph.
 *
 * The graph reference is injected via constructor (typed as interface
 * to avoid direct cross-package imports).
 */

import type { IMarketDataProvider } from "../../domain/ports/IMarketDataProvider.js";
import type { PositionSnapshot } from "../../domain/models/PositionSnapshot.js";

/**
 * Minimal interface for the position graph.
 * Matches PositionGraphStore.getAllSnapshots() without importing
 * directly from the services package.
 */
interface PositionGraphReader {
  getAllSnapshots(limit?: number): Array<{
    user: string;
    collateralUsd: number;
    debtUsd: number;
    healthFactor: number;
    projectedHF: number;
    riskTier: string;
    lastBlock: number;
  }>;
}

export class GraphMarketDataProvider implements IMarketDataProvider {
  private graph: PositionGraphReader;

  constructor(graph: PositionGraphReader) {
    this.graph = graph;
  }

  async fetchPositionSnapshots(
    chainId: string,
    limit: number
  ): Promise<PositionSnapshot[]> {
    const snapshots = this.graph.getAllSnapshots(limit);

    return snapshots.map((s) => ({
      owner: s.user,
      chainId,
      protocol: "aave-v3",
      healthFactor: s.healthFactor,
      collateralUsd: s.collateralUsd,
      debtUsd: s.debtUsd,
      liquidationProximity:
        s.healthFactor > 0 && s.healthFactor < 999
          ? Math.round(((s.healthFactor - 1) / s.healthFactor) * 10000) / 100
          : s.healthFactor >= 999
            ? 100
            : 0,
      timestamp: Date.now(),
    }));
  }
}
