/**
 * AI Agents — Risk Monitoring Agent
 *
 * Bounded context: Aave / AI Agents
 *
 * Decision layer that analyzes computed risk results and determines
 * whether escalation is required. The agent NEVER executes actions
 * directly — it always requests actions through the Action Layer's
 * EscalationService, which enforces authorization via agent.guard.
 *
 * DDD role: Application Service (decision + orchestration).
 *
 * Architecture constraints:
 *   - Agent decides, Action Layer executes
 *   - All actions pass through agent.guard (via escalation service)
 *   - Agent never imports CCIP or infrastructure modules
 *   - Agent never triggers CRE directly
 *   - Synchronous evaluation — no blocking I/O in the hot path
 *   - CRE dispatch is non-blocking (handled by cre-adapter via queueMicrotask)
 *
 * Evaluation logic:
 *   - composite > 0.75 (mapped from riskScore > 75) → request ESCALATE
 *   - black swan detected → request PROTECT_POSITION
 *   - composite > 0.50 → request NOTIFY (informational alert)
 */
import type { PermissionScope } from "../agentic-risk/agent.guard.js";
/**
 * Snapshot of current risk state consumed by the AI agent.
 * Designed to be constructed from MonitorResult + AaveChainMetrics
 * without creating tight coupling.
 */
export interface RiskSnapshot {
    /** Chain this snapshot applies to. */
    chainId: string;
    /** Numeric composite risk score (0..1). ACE output. */
    riskScore: number;
    /** Average health factor across sampled positions. */
    avgHealthFactor: number;
    /**
     * Liquidity change since last evaluation period.
     * Negative = drop. e.g. -0.25 = 25% drop.
     */
    liquidityDelta: number;
    /** Number of positions sampled. */
    sampleSize: number;
    /** Unix ms. */
    timestamp: number;
    /**
     * Current SELVA escalation stage. When provided, agent decisions
     * are driven by the state machine instead of raw composite thresholds.
     */
    escalationStage?: "info" | "confirm" | "invalidate";
}
/**
 * Result of an AI agent evaluation cycle.
 */
export interface AgentEvaluationResult {
    agentId: string;
    chainId: string;
    /** Actions requested by the agent during this evaluation. */
    actionsRequested: string[];
    /** Whether a black swan was detected. */
    blackSwanDetected: boolean;
    /** The composite risk score evaluated. */
    riskScore: number;
    /** Unix ms. */
    evaluatedAt: number;
}
/**
 * AI Risk Monitoring Agent.
 *
 * Constructed with an identity and permission scope. Evaluates
 * risk snapshots and requests appropriate actions through the
 * Action Layer.
 *
 * Usage:
 *   const agent = new AIRiskAgent("aave-risk-agent-01", "risk-actions");
 *   const result = agent.evaluate(snapshot);
 */
export declare class AIRiskAgent {
    readonly agentId: string;
    readonly scope: PermissionScope;
    constructor(agentId: string, scope: PermissionScope);
    /**
     * Evaluate a risk snapshot and request actions if warranted.
     *
     * Synchronous -- all action dispatches are non-blocking
     * (CRE adapter uses queueMicrotask internally).
     *
     * Decision tree (SELVA state-machine driven):
     *   1. Check for black-swan conditions -> PROTECT_POSITION (always)
     *   2. escalationStage === "invalidate" -> ESCALATE
     *   3. escalationStage === "confirm" -> PROTECT_POSITION
     *   4. escalationStage === "info" or absent -> fallback to composite thresholds
     */
    evaluate(snapshot: RiskSnapshot): AgentEvaluationResult;
}
//# sourceMappingURL=ai-risk-agent.d.ts.map