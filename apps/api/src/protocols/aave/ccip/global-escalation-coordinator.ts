/**
 * CCIP — Global Escalation Coordinator
 *
 * Coordinates escalation decisions across all chains.
 *
 * If any chain reports critical risk:
 *   - All chains enter observe-only mode
 *   - Pre-mitigation triggers on all exposed chains
 *
 * Uses RiskStateSynchronizer for aggregate state
 * and global-risk-state for system mode control.
 */

import type { RiskStateSynchronizer } from "./risk-state-synchronizer.js";
import {
  activateObserveOnlyMode,
  restoreNormalMode,
  getSystemMode,
} from "./global-risk-state.js";

export type EscalationPosture = "normal" | "elevated" | "defensive" | "lockdown";

export class GlobalEscalationCoordinator {
  private synchronizer: RiskStateSynchronizer;
  private currentPosture: EscalationPosture = "normal";

  constructor(synchronizer: RiskStateSynchronizer) {
    this.synchronizer = synchronizer;
  }

  /**
   * Evaluate the global risk posture based on all chain states.
   * Adjusts system mode accordingly.
   *
   * Returns the new posture.
   */
  evaluate(): EscalationPosture {
    const aggregateLevel = this.synchronizer.getAggregateRiskLevel();
    const isSystemic = this.synchronizer.isSystemicStress();

    let newPosture: EscalationPosture;

    if (isSystemic) {
      newPosture = "lockdown";
      if (getSystemMode() !== "observe-only") {
        activateObserveOnlyMode();
        console.info("[global-escalation] LOCKDOWN: systemic stress detected across chains");
      }
    } else if (aggregateLevel === "critical") {
      newPosture = "defensive";
      if (getSystemMode() !== "observe-only") {
        activateObserveOnlyMode();
        console.info("[global-escalation] DEFENSIVE: critical risk on at least one chain");
      }
    } else if (aggregateLevel === "early-warning") {
      newPosture = "elevated";
      if (getSystemMode() === "observe-only" && this.currentPosture === "lockdown") {
        // Don't restore from lockdown to elevated — wait for full clear
      }
    } else {
      newPosture = "normal";
      if (getSystemMode() === "observe-only") {
        restoreNormalMode();
        console.info("[global-escalation] NORMAL: all chains safe, restoring operations");
      }
    }

    if (newPosture !== this.currentPosture) {
      console.info(
        `[global-escalation] Posture: ${this.currentPosture} → ${newPosture}`
      );
      this.currentPosture = newPosture;
    }

    return this.currentPosture;
  }

  getPosture(): EscalationPosture {
    return this.currentPosture;
  }
}
