/**
 * Health Engine — Public API
 *
 * Three-layer scoring pipeline:
 *   Layer 1: Deterministic Math Engine (scoring.ts, protocol-scorer.ts, user-scorer.ts)
 *   Layer 2: AI Context & Regime Interpreter (ai-context.ts)
 *   Layer 3: Optional Stress Simulation via Tenderly (future)
 *
 * If AI fails → fallback to deterministic score only.
 * Zero downtime. Zero instability.
 *
 * Usage:
 *   const engine = new HealthEngine();
 *   const protocolScore = await engine.getProtocolHealth("aave");
 *   const userScore = await engine.getUserHealth("0x...", "aave");
 */

import type {
  ProtocolHealthScore,
  UserHealthScore,
  RiskInputs,
} from "@aquarius/types";
import { computeProtocolHealth } from "./protocol-scorer.js";
import { computeUserHealth, buildPositionData } from "./user-scorer.js";
import { ScoreCache } from "./score-cache.js";
import { MOCK_PROTOCOL_RISKS, getMockUserPosition } from "./mock-data.js";
import { calculateHealthScore, buildBreakdown, classifyScore } from "./scoring.js";
import { aiContextLayer, buildAIContextInput } from "./ai-context.js";
import { fetchUserSnapshot, getActiveDataMode } from "./provider-data.js";
import {
  computeLiquidationDistancePct,
  deriveHealthFactorDirection,
} from "./user-risk-mappers.js";

const PROTOCOL_CACHE_TTL = 30_000;
const USER_CACHE_TTL = 10_000;

interface ResolvedUserInputs {
  mode: string;
  healthFactor: number;
  totalCollateralUsd: number;
  totalDebtUsd: number;
  largestCollateralShare: number;
  hasCorrelatedCollateral: boolean;
  hfSlope: number;
}

export class HealthEngine {
  private readonly protocolCache = new ScoreCache<ProtocolHealthScore>(PROTOCOL_CACHE_TTL);
  private readonly userCache = new ScoreCache<UserHealthScore>(USER_CACHE_TTL);

  /**
   * Get protocol-level health score.
   *
   * Pipeline:
   *   1. Compute deterministic score (Layer 1)
   *   2. Pass through AI context layer (Layer 2) for regime detection + bounded adjustment
   *   3. Merge AI reasoning, regime, and adjusted score into final result
   */
  async getProtocolHealth(
    protocol: string,
    chain: string = "ethereum"
  ): Promise<ProtocolHealthScore> {
    const cacheKey = `${protocol}:${chain}`;
    const cached = this.protocolCache.get(cacheKey);
    if (cached) return cached;

    let layer1: ProtocolHealthScore;
    let riskInputs: RiskInputs;
    const mode = getActiveDataMode();

    try {
      const raw = await computeProtocolHealth(protocol, chain);
      riskInputs = raw._riskInputs;
      const { _riskInputs: _, ...rest } = raw;
      layer1 = rest;
    } catch (err) {
      if (mode !== "mock") {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Protocol health source failed in DATA_PROVIDER_MODE=${mode}: ${message}`
        );
      }

      layer1 = this.fallbackProtocolScore(protocol);
      riskInputs = MOCK_PROTOCOL_RISKS[protocol] ?? MOCK_PROTOCOL_RISKS["aave"]!;
    }

    const aiInput = buildAIContextInput(layer1.score, riskInputs);
    const aiResult = await aiContextLayer(aiInput);

    const result: ProtocolHealthScore = {
      ...layer1,
      score: aiResult.score,
      category: aiResult.category,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      regime: aiResult.regime,
      dominantRisk: aiResult.dominantRisk,
      metadata: {
        ...layer1.metadata,
        sources: [...layer1.metadata.sources, "ai-context-engine"],
      },
    };

    this.protocolCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get user-level health score.
   *
   * Pipeline:
   *   1. Compute deterministic user score (Layer 1)
   *   2. Pass through AI context layer (Layer 2) for regime detection + bounded adjustment
   *   3. Merge AI reasoning, regime, and adjusted score into final result
   */
  async getUserHealth(
    user: string,
    protocol: string = "aave",
    chain: string = "ethereum"
  ): Promise<UserHealthScore> {
    const cacheKey = `${user}:${protocol}:${chain}`;
    const cached = this.userCache.get(cacheKey);
    if (cached) return cached;

    const inputs = await this.resolveUserInputs(user, chain);
    const result = await this.buildUserHealthScore(user, protocol, inputs);

    this.userCache.set(cacheKey, result);
    return result;
  }

  private async resolveUserInputs(user: string, chain: string): Promise<ResolvedUserInputs> {
    const mode = getActiveDataMode();
    if (mode === "mock") {
      const mockPosition = getMockUserPosition(user);
      return {
        mode,
        healthFactor: mockPosition.healthFactor,
        totalCollateralUsd: mockPosition.totalCollateralUsd,
        totalDebtUsd: mockPosition.totalDebtUsd,
        largestCollateralShare: mockPosition.largestCollateralShare,
        hasCorrelatedCollateral: mockPosition.hasCorrelatedCollateral,
        hfSlope: mockPosition.hfSlope,
      };
    }

    const liveSnapshot = await fetchUserSnapshot(user, chain);
    if (!liveSnapshot) {
      throw new Error(
        `No active Aave position found for ${user} on ${chain} in DATA_PROVIDER_MODE=${mode}.`
      );
    }

    const debtToCollateral =
      liveSnapshot.collateralUsd > 0
        ? liveSnapshot.debtUsd / liveSnapshot.collateralUsd
        : 0;

    return {
      mode,
      healthFactor: liveSnapshot.healthFactor,
      totalCollateralUsd: liveSnapshot.collateralUsd,
      totalDebtUsd: liveSnapshot.debtUsd,
      largestCollateralShare: Math.max(
        0.35,
        Math.min(0.9, 0.45 + debtToCollateral * 0.4)
      ),
      hasCorrelatedCollateral: false,
      hfSlope:
        liveSnapshot.healthFactor < 1.2
          ? -0.16
          : liveSnapshot.healthFactor < 1.5
            ? -0.1
            : liveSnapshot.healthFactor < 1.9
              ? -0.05
              : 0.02,
    };
  }

  private async buildUserHealthScore(
    user: string,
    protocol: string,
    inputs: ResolvedUserInputs
  ): Promise<UserHealthScore> {
    const positionData = buildPositionData(
      {
        healthFactor: inputs.healthFactor,
        totalCollateralUsd: inputs.totalCollateralUsd,
        totalDebtUsd: inputs.totalDebtUsd,
      },
      {
        largestCollateralShare: inputs.largestCollateralShare,
        hasCorrelatedCollateral: inputs.hasCorrelatedCollateral,
        hfSlope: inputs.hfSlope,
      }
    );

    const layer1 = computeUserHealth(user, protocol, positionData);
    const aiInput = buildAIContextInput(layer1.score, {
      volatility: layer1.penalties.volatility * 10,
      liquidityRisk: layer1.penalties.concentration * 10,
      liquidationRisk: Math.round((1 - inputs.healthFactor / 3) * 100),
      smartContractRisk: layer1.penalties.correlation * 10,
    });
    const aiResult = await aiContextLayer(aiInput);

    const liquidationDistancePct = computeLiquidationDistancePct(inputs.healthFactor);
    const healthFactorDirection = deriveHealthFactorDirection(inputs.hfSlope);

    return {
      ...layer1,
      score: aiResult.score,
      category: aiResult.category,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      regime: aiResult.regime,
      dominantRisk: aiResult.dominantRisk,
      healthFactor: inputs.healthFactor,
      liquidationDistancePct,
      healthFactorDirection,
      metadata: {
        ...layer1.metadata,
        sources: [
          ...layer1.metadata.sources,
          "ai-context-engine",
          `data-provider:${inputs.mode}`,
          ...(inputs.mode === "mock" ? ["mock-user-position"] : []),
        ],
      },
    };
  }

  /**
   * Deterministic fallback when live data is unavailable.
   */
  private fallbackProtocolScore(protocol: string): ProtocolHealthScore {
    const risks = MOCK_PROTOCOL_RISKS[protocol] ?? MOCK_PROTOCOL_RISKS["aave"]!;
    const result = calculateHealthScore(risks);
    const breakdown = buildBreakdown(risks);

    return {
      protocol,
      score: result.score,
      category: result.category,
      confidence: 0.75,
      breakdown,
      reasoning: result.reasoning,
      metadata: {
        block: null,
        timestamp: new Date().toISOString(),
        sources: ["deterministic-model", "mock-risk-inputs"],
      },
    };
  }
}

export { calculateHealthScore, classifyScore, normalizeHealthFactor } from "./scoring.js";
export { computeUserHealth, buildPositionData } from "./user-scorer.js";
export { computeProtocolHealth } from "./protocol-scorer.js";
export { MOCK_PROTOCOL_RISKS, MOCK_USER_POSITIONS, getMockUserPosition } from "./mock-data.js";
