import type { UserHealthScore, UserRiskResponse } from "@aquarius/types";
import { HealthEngine } from "./index.js";
import { buildAgentRecommendation } from "./user-risk-mappers.js";

/**
 * Application-layer projection façade.
 *
 * Keeps HealthEngine focused on deterministic/AI scoring while this
 * service shapes API-facing DTOs for user-risk consumers.
 */
export class UserRiskProjectionService {
  constructor(private readonly healthEngine: HealthEngine = new HealthEngine()) {}

  async getUserRisk(
    user: string,
    protocol: string = "aave",
    chain: string = "ethereum"
  ): Promise<UserRiskResponse> {
    const health = await this.healthEngine.getUserHealth(user, protocol, chain);
    const healthFactor = health.healthFactor ?? 0;
    const liquidationDistancePct = health.liquidationDistancePct ?? 0;
    const healthFactorDirection = health.healthFactorDirection ?? "neutral";
    const mostExposedAsset = health.mostExposedAsset ?? "WETH";
    const agentRecommendation =
      health.agentRecommendation ??
      buildAgentRecommendation(health.category, healthFactor);

    return {
      user: health.user,
      protocol: health.protocol,
      score: health.score,
      category: health.category,
      confidence: health.confidence,
      reasoning: health.reasoning,
      regime: health.regime,
      dominantRisk: health.dominantRisk,
      healthFactor,
      healthFactorDirection,
      liquidationDistancePct,
      mostExposedAsset,
      agentRecommendation,
      metadata: health.metadata,
    };
  }
}
