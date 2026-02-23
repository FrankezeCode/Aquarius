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

import type { ProtocolHealthScore, UserHealthScore, RiskInputs } from "@aquarius/types";
import { computeProtocolHealth } from "./protocol-scorer.js";
import { computeUserHealth, buildPositionData } from "./user-scorer.js";
import { ScoreCache } from "./score-cache.js";
import { MOCK_PROTOCOL_RISKS, getMockUserPosition } from "./mock-data.js";
import { calculateHealthScore, buildBreakdown, classifyScore } from "./scoring.js";
import { aiContextLayer, buildAIContextInput } from "./ai-context.js";

const PROTOCOL_CACHE_TTL = 30_000;
const USER_CACHE_TTL = 10_000;

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

    try {
      const raw = await computeProtocolHealth(protocol, chain);
      riskInputs = raw._riskInputs;
      const { _riskInputs: _, ...rest } = raw;
      layer1 = rest;
    } catch {
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
    protocol: string = "aave"
  ): Promise<UserHealthScore> {
    const cacheKey = `${user}:${protocol}`;
    const cached = this.userCache.get(cacheKey);
    if (cached) return cached;

    const mockPosition = getMockUserPosition(user);
    const positionData = buildPositionData(mockPosition, {
      largestCollateralShare: mockPosition.largestCollateralShare,
      hasCorrelatedCollateral: mockPosition.hasCorrelatedCollateral,
      hfSlope: mockPosition.hfSlope,
    });

    const layer1 = computeUserHealth(user, protocol, positionData);

    const aiInput = buildAIContextInput(layer1.score, {
      volatility: layer1.penalties.volatility * 10,
      liquidityRisk: layer1.penalties.concentration * 10,
      liquidationRisk: Math.round((1 - mockPosition.healthFactor / 3) * 100),
      smartContractRisk: layer1.penalties.correlation * 10,
    });

    const aiResult = await aiContextLayer(aiInput);

    const result: UserHealthScore = {
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

    this.userCache.set(cacheKey, result);
    return result;
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
