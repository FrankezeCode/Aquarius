/**
 * Action Layer — Escalation Service
 *
 * Bounded context: Aave / Action Layer
 *
 * Central orchestrator for agent-requested actions. Every AI agent
 * action flows through this service, which:
 *
 *   1. Validates authorization via agent.guard
 *   2. Logs an audit event
 *   3. Dispatches to the appropriate infrastructure adapter
 *
 * DDD role: Application Service — coordinates domain decisions
 * (from AI agents) with infrastructure execution (CRE adapter,
 * notification service).
 *
 * Design:
 *   - Non-blocking: CRE dispatch via queueMicrotask (in cre-adapter)
 *   - Notification is synchronous console log (zero cost)
 *   - Authorization is synchronous (pure function in agent.guard)
 *   - No Promise chains in the hot path
 */
import { type ActionType, type PermissionScope } from "../agentic-risk/agent.guard.js";
export interface EscalationRequest {
    /** ID of the agent requesting the action. */
    agentId: string;
    /** Permission scope the agent was initialized with. */
    scope: PermissionScope;
    /** Requested action type. */
    actionType: ActionType;
    /** Chain where the risk was detected. */
    chainId: string;
    /** Risk composite score that triggered escalation (0..1). */
    composite: number;
    /** Optional additional context for the CRE workflow. */
    metadata?: Record<string, unknown>;
}
export interface EscalationResult {
    /** Whether the action was authorized and dispatched. */
    dispatched: boolean;
    /** Agent that requested the action. */
    agentId: string;
    /** Action type requested. */
    actionType: ActionType;
    /** Reason (from guard decision). */
    reason: string;
    /** Unix ms. */
    timestamp: number;
}
/**
 * Request an escalation action on behalf of an AI agent.
 *
 * Flow:
 *   1. agent.guard.isAuthorized() — synchronous policy check
 *   2. If denied → return immediately with dispatched=false
 *   3. Audit log the decision
 *   4. Dispatch to CRE adapter (non-blocking via queueMicrotask)
 *   5. Send notification (synchronous console log)
 *   6. Return result
 *
 * This function is synchronous. The CRE trigger is fire-and-forget
 * so the caller (AI agent) is never blocked waiting for infrastructure.
 */
export declare function requestAction(request: EscalationRequest): EscalationResult;
//# sourceMappingURL=escalation.service.d.ts.map