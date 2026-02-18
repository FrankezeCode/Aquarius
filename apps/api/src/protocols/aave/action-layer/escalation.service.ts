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

import {
  isAuthorized,
  type ActionType,
  type PermissionScope,
} from "../agentic-risk/agent.guard.js";
import { triggerCRE, type CREActionPayload } from "./cre-adapter.js";
import { notify } from "./notification.service.js";

// ── Types ────────────────────────────────────────────────────────────

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
export function requestAction(request: EscalationRequest): EscalationResult {
  const now = Date.now();

  // 1. Authorization check (synchronous, zero I/O)
  const decision = isAuthorized(
    request.agentId,
    request.scope,
    request.actionType
  );

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
  console.info(
    `[escalation] DISPATCH | agent=${request.agentId} action=${request.actionType} chain=${request.chainId} composite=${request.composite}`
  );

  // 3. CRE dispatch (non-blocking via queueMicrotask inside triggerCRE)
  const crePayload: CREActionPayload = {
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
