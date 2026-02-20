/**
 * Event Engine — Position Graph Store
 *
 * In-memory real-time risk state graph.
 * Updated incrementally from stream events — never re-fetches full state.
 *
 * This is domain state, NOT infrastructure.
 *
 * Each node represents a user position:
 *   - Collateral assets + amounts
 *   - Debt assets + amounts
 *   - Computed HF
 *   - Projected HF (set by prediction engine)
 *   - Risk tier
 *   - Last updated block
 *
 * Exposes read-only snapshot methods for consumers
 * (prediction engine, API cache, monitors).
 *
 * Performance target: < 1ms for any single update or read.
 */

/**
 * Local risk level type — mirrors AceRiskLevel from the Aave risk-intelligence layer.
 * Defined locally to avoid cross-package dependency from services → apps.
 */
export type GraphRiskLevel = "safe" | "watch" | "early-warning" | "critical";

export interface AssetBalance {
  asset: string;
  amount: number;
  priceUsd: number;
}

export interface UserPosition {
  user: string;
  collateral: Map<string, AssetBalance>;
  debt: Map<string, AssetBalance>;
  collateralUsd: number;
  debtUsd: number;
  healthFactor: number;
  projectedHF: number;
  lastBlock: number;
  volatilitySensitivity: number;
  riskTier: GraphRiskLevel;
  updatedAt: number;
}

export interface PositionSnapshot {
  user: string;
  collateralUsd: number;
  debtUsd: number;
  healthFactor: number;
  projectedHF: number;
  riskTier: GraphRiskLevel;
  lastBlock: number;
}

export interface GraphStats {
  totalPositions: number;
  positionsAtRisk: number;
  avgHealthFactor: number;
  lastUpdateBlock: number;
  lastUpdateTimestamp: number;
}

const MAX_POSITIONS = 10_000;
const HF_AT_RISK_THRESHOLD = 1.25;

export class PositionGraphStore {
  private positions = new Map<string, UserPosition>();
  private oraclePrices = new Map<string, number>();
  private lastBlock = 0;
  private lastUpdateTimestamp = 0;

  /**
   * Update or create a position's collateral for a given asset.
   * Recalculates HF after update.
   */
  updateCollateral(
    user: string,
    asset: string,
    amountDelta: number,
    priceUsd?: number
  ): void {
    const pos = this.getOrCreate(user);
    const existing = pos.collateral.get(asset);
    const price = priceUsd ?? this.oraclePrices.get(asset) ?? existing?.priceUsd ?? 0;

    if (existing) {
      existing.amount += amountDelta;
      existing.priceUsd = price;
      if (existing.amount <= 0) {
        pos.collateral.delete(asset);
      }
    } else if (amountDelta > 0) {
      pos.collateral.set(asset, { asset, amount: amountDelta, priceUsd: price });
    }

    this.recalcPosition(pos);
  }

  /**
   * Update or create a position's debt for a given asset.
   * Recalculates HF after update.
   */
  updateDebt(
    user: string,
    asset: string,
    amountDelta: number,
    priceUsd?: number
  ): void {
    const pos = this.getOrCreate(user);
    const existing = pos.debt.get(asset);
    const price = priceUsd ?? this.oraclePrices.get(asset) ?? existing?.priceUsd ?? 0;

    if (existing) {
      existing.amount += amountDelta;
      existing.priceUsd = price;
      if (existing.amount <= 0) {
        pos.debt.delete(asset);
      }
    } else if (amountDelta > 0) {
      pos.debt.set(asset, { asset, amount: amountDelta, priceUsd: price });
    }

    this.recalcPosition(pos);
  }

  /**
   * Update oracle price for an asset.
   * Recalculates HF for ALL positions holding this asset.
   */
  updatePrice(asset: string, priceUsd: number): void {
    this.oraclePrices.set(asset, priceUsd);

    for (const pos of this.positions.values()) {
      const collateralEntry = pos.collateral.get(asset);
      const debtEntry = pos.debt.get(asset);

      if (collateralEntry || debtEntry) {
        if (collateralEntry) collateralEntry.priceUsd = priceUsd;
        if (debtEntry) debtEntry.priceUsd = priceUsd;
        this.recalcPosition(pos);
      }
    }
  }

  /**
   * Update block number for timestamping.
   */
  updateBlock(blockNumber: number): void {
    this.lastBlock = blockNumber;
    this.lastUpdateTimestamp = Date.now();
  }

  /**
   * Set projected HF from prediction engine (external).
   */
  setProjectedHF(user: string, projectedHF: number): void {
    const pos = this.positions.get(user.toLowerCase());
    if (pos) {
      pos.projectedHF = projectedHF;
    }
  }

  /**
   * Set the full position from an external source (initial load).
   */
  setPosition(
    user: string,
    collateralUsd: number,
    debtUsd: number,
    healthFactor: number,
    blockNumber: number
  ): void {
    if (this.positions.size >= MAX_POSITIONS) {
      this.evictStalePositions();
    }

    const key = user.toLowerCase();
    const existing = this.positions.get(key);

    if (existing) {
      existing.collateralUsd = collateralUsd;
      existing.debtUsd = debtUsd;
      existing.healthFactor = healthFactor;
      existing.projectedHF = healthFactor;
      existing.lastBlock = blockNumber;
      existing.riskTier = this.classifyRisk(healthFactor);
      existing.updatedAt = Date.now();
    } else {
      this.positions.set(key, {
        user: key,
        collateral: new Map(),
        debt: new Map(),
        collateralUsd,
        debtUsd,
        healthFactor,
        projectedHF: healthFactor,
        lastBlock: blockNumber,
        volatilitySensitivity: 0,
        riskTier: this.classifyRisk(healthFactor),
        updatedAt: Date.now(),
      });
    }
  }

  // ── Read-Only Snapshot Methods ───────────────────────────────────

  getPosition(user: string): PositionSnapshot | undefined {
    const pos = this.positions.get(user.toLowerCase());
    if (!pos) return undefined;

    return {
      user: pos.user,
      collateralUsd: pos.collateralUsd,
      debtUsd: pos.debtUsd,
      healthFactor: pos.healthFactor,
      projectedHF: pos.projectedHF,
      riskTier: pos.riskTier,
      lastBlock: pos.lastBlock,
    };
  }

  getPositionsAtRisk(hfThreshold = HF_AT_RISK_THRESHOLD): PositionSnapshot[] {
    const result: PositionSnapshot[] = [];

    for (const pos of this.positions.values()) {
      if (pos.healthFactor > 0 && pos.healthFactor < hfThreshold && pos.debtUsd > 0) {
        result.push({
          user: pos.user,
          collateralUsd: pos.collateralUsd,
          debtUsd: pos.debtUsd,
          healthFactor: pos.healthFactor,
          projectedHF: pos.projectedHF,
          riskTier: pos.riskTier,
          lastBlock: pos.lastBlock,
        });
      }
    }

    return result.sort((a, b) => a.healthFactor - b.healthFactor);
  }

  getAllSnapshots(limit?: number): PositionSnapshot[] {
    const all: PositionSnapshot[] = [];

    for (const pos of this.positions.values()) {
      if (pos.debtUsd > 0) {
        all.push({
          user: pos.user,
          collateralUsd: pos.collateralUsd,
          debtUsd: pos.debtUsd,
          healthFactor: pos.healthFactor,
          projectedHF: pos.projectedHF,
          riskTier: pos.riskTier,
          lastBlock: pos.lastBlock,
        });
      }
    }

    all.sort((a, b) => a.healthFactor - b.healthFactor);
    return limit ? all.slice(0, limit) : all;
  }

  getOraclePrice(asset: string): number | undefined {
    return this.oraclePrices.get(asset);
  }

  getStats(): GraphStats {
    let totalHF = 0;
    let positionsAtRisk = 0;
    let activeCount = 0;

    for (const pos of this.positions.values()) {
      if (pos.debtUsd > 0) {
        activeCount++;
        totalHF += pos.healthFactor;
        if (pos.healthFactor < HF_AT_RISK_THRESHOLD) {
          positionsAtRisk++;
        }
      }
    }

    return {
      totalPositions: activeCount,
      positionsAtRisk,
      avgHealthFactor: activeCount > 0 ? Math.round((totalHF / activeCount) * 1000) / 1000 : 0,
      lastUpdateBlock: this.lastBlock,
      lastUpdateTimestamp: this.lastUpdateTimestamp,
    };
  }

  // ── Internal ─────────────────────────────────────────────────────

  private getOrCreate(user: string): UserPosition {
    const key = user.toLowerCase();
    let pos = this.positions.get(key);

    if (!pos) {
      if (this.positions.size >= MAX_POSITIONS) {
        this.evictStalePositions();
      }

      pos = {
        user: key,
        collateral: new Map(),
        debt: new Map(),
        collateralUsd: 0,
        debtUsd: 0,
        healthFactor: 0,
        projectedHF: 0,
        lastBlock: this.lastBlock,
        volatilitySensitivity: 0,
        riskTier: "safe",
        updatedAt: Date.now(),
      };
      this.positions.set(key, pos);
    }

    return pos;
  }

  private recalcPosition(pos: UserPosition): void {
    let collateralUsd = 0;
    for (const entry of pos.collateral.values()) {
      collateralUsd += entry.amount * entry.priceUsd;
    }

    let debtUsd = 0;
    for (const entry of pos.debt.values()) {
      debtUsd += entry.amount * entry.priceUsd;
    }

    pos.collateralUsd = Math.round(collateralUsd * 100) / 100;
    pos.debtUsd = Math.round(debtUsd * 100) / 100;

    // HF = collateral / debt (simplified; real HF uses liquidation threshold)
    // When we have full collateral data with LT, we use weighted average
    if (debtUsd > 0 && collateralUsd > 0) {
      pos.healthFactor = Math.round((collateralUsd / debtUsd) * 1000) / 1000;
    } else if (collateralUsd > 0) {
      pos.healthFactor = 999;
    } else {
      pos.healthFactor = 0;
    }

    pos.riskTier = this.classifyRisk(pos.healthFactor);
    pos.lastBlock = this.lastBlock;
    pos.updatedAt = Date.now();
  }

  private classifyRisk(hf: number): GraphRiskLevel {
    if (hf <= 0 || hf >= 999) return "safe";
    if (hf < 1.05) return "critical";
    if (hf < 1.25) return "early-warning";
    if (hf < 1.5) return "watch";
    return "safe";
  }

  private evictStalePositions(): void {
    const cutoff = Date.now() - 3600_000; // 1 hour
    for (const [key, pos] of this.positions) {
      if (pos.updatedAt < cutoff && pos.riskTier === "safe") {
        this.positions.delete(key);
      }
    }
  }
}
