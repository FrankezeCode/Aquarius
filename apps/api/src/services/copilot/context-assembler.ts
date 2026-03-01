import { HealthEngine } from "../health-engine/index.js";
import { UserRiskProjectionService } from "../health-engine/user-risk-projection.js";
import { createMarketDataProvider } from "../../adapters/providerFactory.js";
import {
  deriveChainMetrics,
  type AavePositionSnapshot,
} from "../../protocols/aave/risk-intelligence/signals.js";
import { runMonitor } from "../../protocols/aave/risk-intelligence/monitor.js";
import { getEscalationMachine } from "../../protocols/aave/risk-intelligence/escalation-store.js";
import type { CopilotDeterministicContext, CopilotProtocol, CopilotChain } from "./types.js";

export class CopilotContextAssembler {
  constructor(
    private readonly healthEngine: HealthEngine = new HealthEngine(),
    private readonly userRiskService: UserRiskProjectionService = new UserRiskProjectionService()
  ) {}

  async assemble(input: {
    protocol: CopilotProtocol;
    chain: CopilotChain;
    walletAddress?: string;
  }): Promise<CopilotDeterministicContext> {
    const { protocol, chain, walletAddress } = input;
    const missingData: string[] = [];
    const contextTimestamp = Date.now();

    let protocolHealth: CopilotDeterministicContext["protocolHealth"];
    try {
      const health = await this.healthEngine.getProtocolHealth(protocol, chain);
      protocolHealth = {
        score: health.score,
        category: health.category,
        confidence: health.confidence,
        reasoning: health.reasoning,
        regime: health.regime,
        dominantRisk: health.dominantRisk,
      };
    } catch {
      missingData.push("protocolHealth");
    }

    let userRisk: CopilotDeterministicContext["userRisk"];
    if (walletAddress) {
      try {
        const user = await this.userRiskService.getUserRisk(walletAddress, protocol, chain);
        userRisk = {
          score: user.score,
          category: user.category,
          confidence: user.confidence,
          reasoning: user.reasoning,
          healthFactor: user.healthFactor,
          liquidationDistancePct: user.liquidationDistancePct,
          healthFactorDirection: user.healthFactorDirection,
          mostExposedAsset: user.mostExposedAsset,
          agentRecommendation: user.agentRecommendation,
          regime: user.regime,
          dominantRisk: user.dominantRisk,
        };
      } catch {
        missingData.push("userRisk");
      }
    } else {
      missingData.push("walletAddress");
    }

    let escalation: CopilotDeterministicContext["escalation"];
    let positionSummary: CopilotDeterministicContext["positionSummary"];
    try {
      const provider = createMarketDataProvider();
      const positions = (await provider.fetchPositionSnapshots(
        chain,
        50
      )) as AavePositionSnapshot[];
      const metrics = deriveChainMetrics(chain, positions);
      positionSummary = {
        totalPositions: metrics.totalPositions,
        positionsAtRisk: metrics.positionsAtRisk,
        avgHealthFactor: metrics.avgHealthFactor,
      };

      const monitor = await runMonitor(chain, positions);
      const machine = getEscalationMachine(chain);
      const state = machine.update(
        monitor.score.composite,
        monitor.score.dimensions,
        Date.now()
      ).state;
      escalation = {
        stage: state.stage,
        actionRequired:
          state.stage === "confirm"
            ? "protect"
            : state.stage === "invalidate"
              ? "escalate"
              : "none",
        accumulator: state.accumulator,
        transitionReason: state.transitionReason,
        stageStability: state.stageStability,
        velocity: state.velocity,
      };
    } catch {
      missingData.push("escalation");
    }

    return {
      protocol,
      chain,
      contextTimestamp,
      protocolHealth,
      userRisk,
      escalation,
      positionSummary,
      missingData,
    };
  }
}

