/**
 * Buffer health — pure domain math for solvency signals (no I/O).
 *
 * USD notionals use a caller-supplied stub map (config/oracle in infrastructure).
 */

import type { AaveRiskSnapshot } from "../../domain/aave-risk-snapshot.js";
import type { CollateralAsset } from "./collateral-asset.js";
import type { UnderlyingAsset } from "./aq-asset.js";
import {
  resolveStrategy,
  type MitigationAction,
  type RiskMitigationStrategy,
} from "./risk-mitigation-strategy.js";

// ── Policy ───────────────────────────────────────────────────────────

export interface BufferPolicyConfig {
  readonly minimumTvlUsd: number;
  /** Drawdown vs previous snapshot that triggers warning (0–100). */
  readonly drawdownWarningPct: number;
  /** Modeled refill rate for time-to-refill proxy (USD/hour). */
  readonly refillAssumedUsdPerHour: number;
  /** Default stress drain for projections when query omits override. */
  readonly defaultStressDrawUsdPerHour: number;
  readonly defaultStressHorizonHours: number;
}

export type BufferAlertLevel = "ok" | "warning" | "critical";

export interface BufferHealthSnapshot {
  readonly tvlUsd: number;
  readonly minimumTvlUsd: number;
  /** max(0, minimumTvlUsd - tvlUsd) — shortfall vs policy floor. */
  readonly gapUsd: number;
  /** Drawdown vs previous TVL (0 if no previous or previous ≤ 0). */
  readonly drawdownPct: number;
  readonly alertLevel: BufferAlertLevel;
  /** Hours to close gap at modeled refill rate; null if no gap or rate ≤ 0. */
  readonly timeToRefillHours: number | null;
}

export interface StressSolvencyResult {
  readonly stressDrawUsdPerHour: number;
  readonly horizonHours: number;
  readonly projectedTvlUsd: number;
  readonly solventAtHorizon: boolean;
}

const DEFAULT_USD_PER_UNIT: Record<UnderlyingAsset, number> = {
  ETH: 3000,
  WETH: 3000,
  POL: 0.5,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  WBTC: 65_000,
};

/**
 * Merge env/config overrides onto defaults (missing keys use defaults).
 */
export function buildUsdPerUnitMap(
  overrides: Partial<Record<UnderlyingAsset, number>> | undefined
): Record<UnderlyingAsset, number> {
  return { ...DEFAULT_USD_PER_UNIT, ...overrides };
}

/**
 * Aggregate TVL in USD from collateral rows using notional units × USD/unit.
 */
export function aggregateTvlUsd(
  collaterals: readonly CollateralAsset[],
  usdPerUnit: Record<UnderlyingAsset, number>
): number {
  let sum = 0;
  for (const c of collaterals) {
    const px = usdPerUnit[c.underlying] ?? 0;
    const units = c.amount + c.pendingYield;
    sum += units * px;
  }
  return Math.round(sum * 1e6) / 1e6;
}

export function computeBufferHealth(input: {
  tvlUsd: number;
  minimumTvlUsd: number;
  previousTvlUsd?: number;
  policy: Pick<BufferPolicyConfig, "drawdownWarningPct">;
}): BufferHealthSnapshot {
  const { tvlUsd, minimumTvlUsd, previousTvlUsd, policy } = input;
  const gapUsd = Math.max(0, minimumTvlUsd - tvlUsd);

  let drawdownPct = 0;
  if (
    previousTvlUsd != null &&
    previousTvlUsd > 0 &&
    tvlUsd <= previousTvlUsd
  ) {
    drawdownPct = ((previousTvlUsd - tvlUsd) / previousTvlUsd) * 100;
  }

  let alertLevel: BufferAlertLevel = "ok";
  if (gapUsd > 0) {
    alertLevel = "critical";
  } else if (drawdownPct >= policy.drawdownWarningPct) {
    alertLevel = "warning";
  }

  return {
    tvlUsd,
    minimumTvlUsd,
    gapUsd,
    drawdownPct: Math.round(drawdownPct * 1e4) / 1e4,
    alertLevel,
    timeToRefillHours: null,
  };
}

/**
 * Attach time-to-refill proxy (requires full policy with refill rate).
 */
export function withTimeToRefill(
  snapshot: BufferHealthSnapshot,
  policy: Pick<BufferPolicyConfig, "refillAssumedUsdPerHour">
): BufferHealthSnapshot {
  const { gapUsd } = snapshot;
  const rate = policy.refillAssumedUsdPerHour;
  if (gapUsd <= 0 || rate <= 0) {
    return { ...snapshot, timeToRefillHours: null };
  }
  return {
    ...snapshot,
    timeToRefillHours: Math.round((gapUsd / rate) * 1e4) / 1e4,
  };
}

export function projectSolvencyUnderStress(input: {
  tvlUsd: number;
  minimumTvlUsd: number;
  stressDrawUsdPerHour: number;
  horizonHours: number;
}): StressSolvencyResult {
  const { tvlUsd, minimumTvlUsd, stressDrawUsdPerHour, horizonHours } = input;
  const projectedTvlUsd =
    Math.round((tvlUsd - stressDrawUsdPerHour * horizonHours) * 1e6) / 1e6;
  return {
    stressDrawUsdPerHour,
    horizonHours,
    projectedTvlUsd,
    solventAtHorizon: projectedTvlUsd >= minimumTvlUsd,
  };
}

/** Suggestion only — aligns with `watch` → INCREASE_BUFFER in strategy map. */
export function suggestMitigationForWatch(
  snapshot: AaveRiskSnapshot
): {
  action: MitigationAction;
  strategy: RiskMitigationStrategy;
} | null {
  if (snapshot.riskLevel !== "watch") {
    return null;
  }
  const strategy = resolveStrategy("watch");
  return { action: strategy.action, strategy };
}
