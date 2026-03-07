/**
 * Execution Layer — Execution Router
 *
 * Routes execution decisions to the appropriate adapter based on
 * EXECUTION_MODE environment variable.
 *
 * Implements ExecutionPort (shared kernel interface) so the
 * application layer (EscalationService) has zero knowledge
 * of whether execution is simulated, confidential, or public.
 *
 * Modes:
 *   - observe_only   → log and skip (no-op)
 *   - simulated_ccc  → CccExecutionAdapter (Tenderly fork)
 *   - local_don_ccc  → Callback-driven local DON simulation handoff to CCC adapter
 *   - real_ccc       → Future Chainlink DON (not yet implemented)
 *
 * All decisions are logged for audit.
 * Never leaks keys or strategy details.
 */

import type {
  ExecutionPort,
  ExecutionContext,
} from "../../protocols/shared/types/execution-context.js";
import type { CccExecutionAdapter } from "../ccc/CccExecutionAdapter.js";
import type {
  MitigationIntent,
  ExecutionReport,
} from "../../domain/events/MitigationIntent.js";
import type { ActionTemplate } from "./mitigation-registry.js";
import { resolveTemplates, classifyRiskType } from "./mitigation-registry.js";

export type ExecutionRouterMode =
  | "observe_only"
  | "simulated_ccc"
  | "local_don_ccc"
  | "real_ccc";

export interface ExecutionDecision {
  mode: ExecutionRouterMode;
  context: ExecutionContext;
  templates: ActionTemplate[];
  report?: ExecutionReport;
  timestamp: number;
}

export class ExecutionRouter implements ExecutionPort {
  private mode: ExecutionRouterMode;
  private cccAdapter: CccExecutionAdapter | null;
  private decisionLog: ExecutionDecision[] = [];
  private maxLogSize = 1000;

  constructor(
    mode?: ExecutionRouterMode,
    cccAdapter?: CccExecutionAdapter | null
  ) {
    this.mode = (mode ?? process.env.EXECUTION_MODE ?? "observe_only") as ExecutionRouterMode;
    this.cccAdapter = cccAdapter ?? null;

    console.info(`[execution-router] Mode: ${this.mode}`);
  }

  /**
   * ExecutionPort implementation.
   * Routes to the correct adapter based on mode.
   */
  async execute(context: ExecutionContext): Promise<void> {
    const decision: ExecutionDecision = {
      mode: this.mode,
      context,
      templates: [],
      timestamp: Date.now(),
    };

    switch (this.mode) {
      case "observe_only":
        console.info(
          `[execution-router] OBSERVE_ONLY | agent=${context.agentId} action=${context.action} risk=${context.riskLevel}`
        );
        break;

      case "simulated_ccc":
      case "local_don_ccc":
      case "real_ccc":
        await this.executeCCC(context, decision);
        break;

      default:
        console.warn(
          `[execution-router] Unknown mode: ${this.mode}, defaulting to observe_only`
        );
    }

    this.logDecision(decision);
  }

  /**
   * Execute a mitigation through the CCC pipeline.
   * Resolves templates from the mitigation registry,
   * then dispatches to the CCC adapter.
   *
   * local_don_ccc note:
   * - Router behavior is intentionally identical to simulated_ccc at this layer.
   * - The "DON-like" behavior is enforced upstream in callback ingress
   *   (correlation reserve/replay/timeout gates).
   * - Keeping router logic shared prevents mode drift for mitigation semantics.
   */
  private async executeCCC(
    context: ExecutionContext,
    decision: ExecutionDecision
  ): Promise<void> {
    if (!this.cccAdapter) {
      console.warn("[execution-router] CCC adapter not available, falling back to observe_only");
      return;
    }

    const riskType = classifyRiskType(
      context.riskLevel === "CRITICAL" ? 1.0 : 0.5,
      context.riskLevel === "CRITICAL" ? 0.9 : 0.5,
      context.riskLevel === "CRITICAL" || context.riskLevel === "HIGH",
      context.riskLevel === "CRITICAL" ? 0.8 : 0.3
    );

    const templates = resolveTemplates(riskType);
    decision.templates = templates;

    if (templates.length === 0) {
      console.warn(`[execution-router] No templates for risk type: ${riskType}`);
      return;
    }

    const template = templates[0]!;

    const intent: MitigationIntent = {
      id: `mitigation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: template.type,
      user: (context.payload as Record<string, string>)?.user ?? "unknown",
      chainId: (context.payload as Record<string, string>)?.chainId ?? "1",
      protocol: (context.payload as Record<string, string>)?.protocol ?? "aave",
      asset: (context.payload as Record<string, string>)?.asset ?? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      amount: String(template.amountValue),
      preHealthFactor: context.riskLevel === "CRITICAL" ? 1.02 : 1.2,
      targetHealthFactor: context.riskLevel === "CRITICAL" ? 1.25 : 1.5,
      riskScore: context.riskLevel === "CRITICAL" ? 90 : context.riskLevel === "HIGH" ? 70 : 50,
      riskBand: riskType,
      agentId: context.agentId,
      timestamp: Date.now(),
    };

    console.info(
      `[execution-router] CCC EXECUTE | type=${intent.type} user=${intent.user} amount=${intent.amount}`
    );

    try {
      const report = await this.cccAdapter.executeMitigation(intent);
      decision.report = report;
    } catch (e) {
      console.error(
        `[execution-router] CCC execution failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  private logDecision(decision: ExecutionDecision): void {
    this.decisionLog.push(decision);
    if (this.decisionLog.length > this.maxLogSize) {
      this.decisionLog = this.decisionLog.slice(-this.maxLogSize / 2);
    }
  }

  /**
   * Get recent execution decisions (for diagnostics/API).
   */
  getRecentDecisions(limit = 20): ExecutionDecision[] {
    return this.decisionLog.slice(-limit);
  }

  getMode(): ExecutionRouterMode {
    return this.mode;
  }
}
