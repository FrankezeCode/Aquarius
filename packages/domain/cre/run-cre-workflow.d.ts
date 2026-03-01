/**
 * CRE Workflow — Single Orchestration Function
 *
 * Application layer: orchestrates the full Aquarius CRE pipeline.
 *
 *   1. Risk Intelligence  (signals → correlate → score → monitor)
 *   2. Agent Decision      (AIRiskAgent evaluation)
 *   3. LLM Reasoning       (optional, async, non-blocking)
 *   4. Action Dispatch      (escalation service, CRE adapter)
 *
 * Rules:
 *   - No UI imports
 *   - No framework dependencies
 *   - Pure orchestration
 *   - Deterministic layers must complete < 100ms total (excluding LLM)
 *   - LLM must NOT block the deterministic path
 *
 * Shared by: CLI (`pnpm run:cre`) and API (`/api/cre/run`)
 */
import type { IMarketDataProvider } from "../../../apps/api/src/domain/ports/IMarketDataProvider.js";
import type { Stage, ActionRequired, LastAction, StageStability } from "../../../apps/api/src/protocols/aave/risk-intelligence/escalation-state-machine.js";
export type ProtocolStatus = "stable" | "watch" | "high-risk";
export interface CREWorkflowResult {
    protocolStatus: ProtocolStatus;
    riskScore: {
        composite: number;
        level: string;
        summary: string;
        dimensions: Array<{
            label: string;
            value: number;
            weight: number;
        }>;
        sampleSize: number;
    };
    riskFactors: Array<{
        id: string;
        label: string;
        value: string;
        direction?: "up" | "down" | "neutral";
        interpretation?: string;
        action?: string;
    }>;
    riskProgression: {
        stage: Stage;
        accumulator: number;
        convergenceSignals: string[];
        enteredAt: number;
        transitionReason: string;
        lastAction: LastAction | null;
        actionRequired: ActionRequired;
        velocity?: number;
        stageStability?: StageStability;
        timeline?: Array<{
            type: string;
            timestamp: number;
            reason: string;
        }>;
    };
    agentDecision: {
        decision: string;
        confidence: number;
        actionsRequested: string[];
        blackSwanDetected: boolean;
    };
    llmReasoning?: {
        action: string;
        confidence: number;
        reason: string;
    };
    actionDispatch: {
        dispatched: string[];
    };
    latencies: {
        risk: number;
        agent: number;
        llm?: number;
        action: number;
        total: number;
    };
    events: Array<{
        id: string;
        timestamp: string;
        message: string;
        severity: "info" | "warning" | "critical";
    }>;
    timestamp: number;
}
export interface CREWorkflowOptions {
    /** Injected data provider. If omitted, falls back to legacy fetch. */
    provider?: IMarketDataProvider;
    chainId?: string;
    positionLimit?: number;
    enableLLM?: boolean;
    groqApiKey?: string;
}
/**
 * Execute the full CRE monitoring workflow.
 *
 * Single orchestration point shared by CLI and API.
 * No UI imports. No framework dependencies. Pure orchestration.
 */
export declare function runCREWorkflow(options?: CREWorkflowOptions): Promise<CREWorkflowResult>;
//# sourceMappingURL=run-cre-workflow.d.ts.map