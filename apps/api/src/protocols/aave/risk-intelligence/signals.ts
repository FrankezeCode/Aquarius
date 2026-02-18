/**
 * Risk-Intelligence — Signals
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Fetches raw Aave metrics that feed the risk scoring pipeline.
 * Each function returns a lightweight DTO — no heavy deps, no side-effects.
 *
 * Data sources (current):
 *   - Mock / placeholder data for local single-chain POC
 *
 * Data sources (next iteration):
 *   - On-chain adapters via viem / ethers
 *   - Aave subgraph / Aave V3 SDK
 *   - CRE workflow telemetry
 */

// ── Types ────────────────────────────────────────────────────────────

/** A single position snapshot fetched from on-chain or cache. */
export interface AavePositionSnapshot {
  /** Wallet or proxy address owning the position. */
  owner: string;
  /** Chain the position lives on. */
  chainId: string;
  /** Current health factor (HF). 1.0 = liquidation threshold. */
  healthFactor: number;
  /** Total collateral value in USD. */
  collateralUsd: number;
  /** Total debt value in USD. */
  debtUsd: number;
  /** Distance (%) from current HF to liquidation (HF = 1). */
  liquidationProximity: number;
  /** Unix ms when this snapshot was taken. */
  timestamp: number;
}

/** Aggregate metrics for a single chain's Aave deployment. */
export interface AaveChainMetrics {
  chainId: string;
  totalPositions: number;
  avgHealthFactor: number;
  medianHealthFactor: number;
  /** Positions with HF < 1.25 (approaching danger). */
  positionsAtRisk: number;
  /** Total collateral across all tracked positions, USD. */
  totalCollateralUsd: number;
  /** Total debt across all tracked positions, USD. */
  totalDebtUsd: number;
  timestamp: number;
}

// ── Mock helpers (replace with on-chain adapters) ────────────────────

function mockPositions(chainId: string, count: number): AavePositionSnapshot[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const hf = 1.0 + Math.random() * 2.5; // 1.0 – 3.5
    const collateral = 5_000 + Math.random() * 95_000;
    const debt = collateral / hf;
    return {
      owner: `0x${chainId.slice(0, 4)}${"0".repeat(36)}${String(i).padStart(4, "0")}`,
      chainId,
      healthFactor: Math.round(hf * 1000) / 1000,
      collateralUsd: Math.round(collateral * 100) / 100,
      debtUsd: Math.round(debt * 100) / 100,
      liquidationProximity: Math.round(((hf - 1) / hf) * 10000) / 100,
      timestamp: now,
    };
  });
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Fetch position snapshots for a given chain.
 *
 * In production this calls the on-chain adapter layer; currently returns
 * deterministic mock data suitable for the local POC.
 */
export async function fetchPositionSnapshots(
  chainId: string,
  limit = 50
): Promise<AavePositionSnapshot[]> {
  // TODO: Replace with real adapter call
  // e.g. const positions = await aaveAdapter.getPositions(chainId, limit);
  return mockPositions(chainId, limit);
}

/**
 * Derive aggregate chain metrics from a set of position snapshots.
 *
 * Pure function — no I/O.
 */
export function deriveChainMetrics(
  chainId: string,
  positions: AavePositionSnapshot[]
): AaveChainMetrics {
  if (positions.length === 0) {
    return {
      chainId,
      totalPositions: 0,
      avgHealthFactor: 0,
      medianHealthFactor: 0,
      positionsAtRisk: 0,
      totalCollateralUsd: 0,
      totalDebtUsd: 0,
      timestamp: Date.now(),
    };
  }

  const sorted = [...positions].sort((a, b) => a.healthFactor - b.healthFactor);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1]!.healthFactor + sorted[mid]!.healthFactor) / 2
      : sorted[mid]!.healthFactor;

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  return {
    chainId,
    totalPositions: positions.length,
    avgHealthFactor:
      Math.round((sum(positions.map((p) => p.healthFactor)) / positions.length) * 1000) / 1000,
    medianHealthFactor: Math.round(median * 1000) / 1000,
    positionsAtRisk: positions.filter((p) => p.healthFactor < 1.25).length,
    totalCollateralUsd: Math.round(sum(positions.map((p) => p.collateralUsd)) * 100) / 100,
    totalDebtUsd: Math.round(sum(positions.map((p) => p.debtUsd)) * 100) / 100,
    timestamp: Date.now(),
  };
}

/**
 * High-level convenience: fetch + derive in one call.
 */
export async function fetchChainMetrics(
  chainId: string,
  positionLimit = 50
): Promise<AaveChainMetrics> {
  const positions = await fetchPositionSnapshots(chainId, positionLimit);
  return deriveChainMetrics(chainId, positions);
}
