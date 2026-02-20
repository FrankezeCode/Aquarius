/**
 * CCIP — Risk Broadcast Service
 *
 * Broadcasts risk state to all registered destination chains.
 * Uses CCIP sender to dispatch risk signals cross-chain.
 *
 * Currently: stubbed interface with logging.
 * Future: real CCIP Router contract integration.
 *
 * Pluggable — swap implementation without changing callers.
 */

import { dispatchCrossChainRisk } from "./sender.js";
import type { CrossChainRiskSignal } from "../risk-intelligence/domain-events.js";
import type { AceRiskLevel } from "../risk-intelligence/scorer.js";

export interface BroadcastConfig {
  destinationChains: string[];
  minRiskLevel: AceRiskLevel;
}

const DEFAULT_CONFIG: BroadcastConfig = {
  destinationChains: (process.env.CCIP_DESTINATION_CHAINS ?? "").split(",").filter(Boolean),
  minRiskLevel: "early-warning",
};

const RISK_SEVERITY: Record<AceRiskLevel, number> = {
  safe: 0,
  watch: 1,
  "early-warning": 2,
  critical: 3,
};

export class RiskBroadcastService {
  private config: BroadcastConfig;

  constructor(config?: Partial<BroadcastConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Broadcast a risk signal to all registered destination chains
   * if the risk level meets the minimum threshold.
   */
  broadcast(signal: CrossChainRiskSignal): void {
    if (RISK_SEVERITY[signal.riskLevel] < RISK_SEVERITY[this.config.minRiskLevel]) {
      return;
    }

    console.info(
      `[risk-broadcast] Broadcasting ${signal.riskLevel} signal from ${signal.sourceChain} to ${this.config.destinationChains.length} chains`
    );

    for (const chain of this.config.destinationChains) {
      const chainSignal: CrossChainRiskSignal = {
        ...signal,
        sourceChain: `${signal.sourceChain}→${chain}`,
      };

      // Non-blocking dispatch via existing CCIP sender
      dispatchCrossChainRisk(chainSignal);
    }
  }
}
