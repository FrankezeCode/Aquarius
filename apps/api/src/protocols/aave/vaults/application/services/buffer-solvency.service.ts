/**
 * Buffer solvency query — application service (read-only metrics).
 */

import type { AaveRiskSnapshot } from "../../../domain/aave-risk-snapshot.js";
import type { UnderlyingAsset } from "../../domain/aq-asset.js";
import type { BufferVaultPort } from "../ports/vault.port.js";
import type { Config } from "../../../../../config/index.js";
import {
  aggregateTvlUsd,
  buildUsdPerUnitMap,
  computeBufferHealth,
  projectSolvencyUnderStress,
  suggestMitigationForWatch,
  withTimeToRefill,
  type BufferPolicyConfig,
} from "../../domain/buffer-health.js";

export interface BufferHealthResponseDto {
  readonly generatedAt: string;
  readonly disclosureKind: "internal";
  /** Not a public SLA or customer promise. */
  readonly notPublicSla: true;
  readonly tvlUsd: number;
  readonly minimumTvlUsd: number;
  readonly gapUsd: number;
  readonly drawdownPct: number;
  readonly alertLevel: "ok" | "warning" | "critical";
  readonly timeToRefillHours: number | null;
  readonly stress: {
    readonly stressDrawUsdPerHour: number;
    readonly horizonHours: number;
    readonly projectedTvlUsd: number;
    readonly solventAtHorizon: boolean;
  };
  readonly watchSuggestion: {
    readonly action: string;
    readonly description: string;
  } | null;
}

function policyFromConfig(cfg: Config): BufferPolicyConfig {
  return {
    minimumTvlUsd: cfg.bufferMinimumTvlUsd,
    drawdownWarningPct: cfg.bufferDrawdownWarningPct,
    refillAssumedUsdPerHour: cfg.bufferRefillAssumedUsdPerHour,
    defaultStressDrawUsdPerHour: cfg.bufferDefaultStressDrawUsdPerHour,
    defaultStressHorizonHours: cfg.bufferDefaultStressHorizonHours,
  };
}

export class BufferSolvencyService {
  private lastObservedTvlUsd: number | undefined;

  constructor(
    private readonly buffer: BufferVaultPort,
    private readonly getConfig: () => Config
  ) {}

  resetLastTvlForTests(): void {
    this.lastObservedTvlUsd = undefined;
  }

  async getHealth(input?: {
    stressDrawUsdPerHour?: number;
    horizonHours?: number;
    riskSnapshot?: AaveRiskSnapshot;
  }): Promise<BufferHealthResponseDto> {
    const cfg = this.getConfig();
    const policy = policyFromConfig(cfg);
    const usdMap = buildUsdPerUnitMap(
      cfg.bufferUsdPerUnitOverrides as Partial<Record<UnderlyingAsset, number>>
    );

    const { collaterals } = await this.buffer.snapshotPositionsForMetrics();
    const tvlUsd = aggregateTvlUsd(collaterals, usdMap);

    let base = computeBufferHealth({
      tvlUsd,
      minimumTvlUsd: policy.minimumTvlUsd,
      previousTvlUsd: this.lastObservedTvlUsd,
      policy,
    });
    base = withTimeToRefill(base, policy);
    this.lastObservedTvlUsd = tvlUsd;

    const stressDraw =
      input?.stressDrawUsdPerHour ?? policy.defaultStressDrawUsdPerHour;
    const horizon =
      input?.horizonHours ?? policy.defaultStressHorizonHours;
    const stress = projectSolvencyUnderStress({
      tvlUsd,
      minimumTvlUsd: policy.minimumTvlUsd,
      stressDrawUsdPerHour: stressDraw,
      horizonHours: horizon,
    });

    const snap = input?.riskSnapshot;
    const sug = snap ? suggestMitigationForWatch(snap) : null;

    return {
      generatedAt: new Date().toISOString(),
      disclosureKind: "internal",
      notPublicSla: true,
      tvlUsd: base.tvlUsd,
      minimumTvlUsd: base.minimumTvlUsd,
      gapUsd: base.gapUsd,
      drawdownPct: base.drawdownPct,
      alertLevel: base.alertLevel,
      timeToRefillHours: base.timeToRefillHours,
      stress: {
        stressDrawUsdPerHour: stress.stressDrawUsdPerHour,
        horizonHours: stress.horizonHours,
        projectedTvlUsd: stress.projectedTvlUsd,
        solventAtHorizon: stress.solventAtHorizon,
      },
      watchSuggestion: sug
        ? {
            action: sug.action,
            description: sug.strategy.description,
          }
        : null,
    };
  }
}
