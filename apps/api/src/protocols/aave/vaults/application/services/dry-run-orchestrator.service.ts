/**
 * Vault Dry-Run Orchestrator — Application Service
 *
 * Bounded context: Aave / Vaults / Application
 *
 * Simulates the full agentic vault pipeline WITHOUT executing any real
 * CRE actions. Composes the monitoring agent and secure agent to produce
 * a list of decisions that WOULD be executed in production.
 *
 * DDD role: Application Service (pipeline orchestration).
 *
 * Pipeline:
 *   AaveRiskSnapshot
 *       ↓
 *   VaultMonitoringAgent.evaluateAssets()  → VaultRiskAlert[]
 *       ↓ (filter: requiresAction only)
 *   SecureVaultAgent.execute()             → VaultAgentDecision | null
 *       ↓ (collect non-null)
 *   VaultAgentDecision[]                   → dry-run output
 *
 * RULES:
 *   - No CRE calls — this is DRY RUN only
 *   - No vault state mutation
 *   - No infrastructure dependencies beyond BufferVaultPort (read-only)
 *   - Fully deterministic for the same inputs
 *   - Structured audit logging for observability
 *
 * Future:
 *   - CRE integration will wrap this orchestrator and dispatch decisions
 *   - LLM advisor can augment the action agent without changing this flow
 */

import { VaultMonitoringAgent } from "./monitoring-agent.service.js";
import { SecureVaultAgent } from "./secure-agent.service.js";
import type { AaveRiskSnapshot } from "../../../domain/aave-risk-snapshot.js";
import type { AqAsset } from "../../domain/aq-asset.js";
import type { VaultAgentDecision } from "../../domain/agent-decision.js";

// ── Types ────────────────────────────────────────────────────────────

export interface DryRunResult {
  /** Total aqAssets evaluated. */
  readonly assetsEvaluated: number;
  /** Number of alerts that required action. */
  readonly alertsTriggered: number;
  /** Decisions that would be executed in production. */
  readonly decisions: readonly VaultAgentDecision[];
  /** The risk level from the input snapshot. */
  readonly snapshotRiskLevel: string;
  /** Unix ms when the dry run completed. */
  readonly timestamp: number;
}

// ── Service ──────────────────────────────────────────────────────────

export class VaultDryRunOrchestrator {
  private readonly monitor: VaultMonitoringAgent;
  private readonly secureAgent: SecureVaultAgent;

  constructor(
    monitor: VaultMonitoringAgent,
    secureAgent: SecureVaultAgent
  ) {
    this.monitor = monitor;
    this.secureAgent = secureAgent;
  }

  /**
   * Simulate the full agentic pipeline for a set of aqAssets.
   *
   * This is the primary entry point for dry-run testing.
   * It produces decisions without executing any CRE actions.
   *
   * @param assets    The aqAssets to evaluate
   * @param snapshot  The pre-scored risk snapshot
   * @returns         DryRunResult with all decisions
   */
  simulate(
    assets: readonly AqAsset[],
    snapshot: AaveRiskSnapshot
  ): DryRunResult {
    // 1. Monitor: evaluate all assets against snapshot
    const alerts = this.monitor.evaluateAssets(assets, snapshot);

    // 2. Decide: run secure agent on actionable alerts only
    const decisions: VaultAgentDecision[] = [];

    for (const alert of alerts) {
      if (!alert.requiresAction) continue;

      const decision = this.secureAgent.execute({
        assetId: alert.assetId,
        riskLevel: alert.riskLevel,
      });

      if (decision) {
        decisions.push(decision);
      }
    }

    // 3. Audit log (non-blocking, informational only)
    console.info(
      `[vault-dryrun] SIMULATE | assets=${assets.length} alerts=${alerts.filter((a) => a.requiresAction).length} decisions=${decisions.length} riskLevel=${snapshot.riskLevel}`
    );

    return {
      assetsEvaluated: assets.length,
      alertsTriggered: alerts.filter((a) => a.requiresAction).length,
      decisions,
      snapshotRiskLevel: snapshot.riskLevel,
      timestamp: Date.now(),
    };
  }
}
