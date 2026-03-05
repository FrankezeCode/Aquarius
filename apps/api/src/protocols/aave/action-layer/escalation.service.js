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
import { isAuthorized, } from "../agentic-risk/agent.guard.js";
import { triggerCRE } from "./cre-adapter.js";
import { notify } from "./notification.service.js";
// ── Public API ───────────────────────────────────────────────────────
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
export function requestAction(request) {
    const now = Date.now();
    // 1. Authorization check (synchronous, zero I/O)
    const decision = isAuthorized(request.agentId, request.scope, request.actionType);
    if (!decision.authorized) {
        // Denied — audit logged inside isAuthorized(), return immediately
        return {
            dispatched: false,
            agentId: request.agentId,
            actionType: request.actionType,
            reason: decision.reason,
            timestamp: now,
        };
    }
    // 2. Audit log (successful authorization)
    console.info(`[escalation] DISPATCH | agent=${request.agentId} action=${request.actionType} chain=${request.chainId} composite=${request.composite}`);
    // 3. CRE dispatch (non-blocking via queueMicrotask inside triggerCRE)
    const crePayload = {
        agentId: request.agentId,
        actionType: request.actionType,
        chainId: request.chainId,
        composite: request.composite,
        metadata: request.metadata ?? {},
        timestamp: now,
    };
    triggerCRE(crePayload);
    // 4. Notification (synchronous console log — zero cost)
    notify({
        agentId: request.agentId,
        actionType: request.actionType,
        chainId: request.chainId,
        composite: request.composite,
        message: `Risk escalation: ${request.actionType} on ${request.chainId} (composite=${request.composite})`,
        timestamp: now,
    });
    return {
        dispatched: true,
        agentId: request.agentId,
        actionType: request.actionType,
        reason: decision.reason,
        timestamp: now,
    };
}
