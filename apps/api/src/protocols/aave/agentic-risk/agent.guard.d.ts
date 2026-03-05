/**
 * Agentic Risk — Agent Guard
 *
 * Bounded context: Aave / Agentic Risk
 *
 * Authorization gate for AI agents. Every agent action request must
 * pass through this guard before reaching the Action Layer.
 *
 * DDD role: Domain Service (policy enforcement).
 *
 * Design:
 *   - Synchronous — zero-cost in the hot path
 *   - Stateless policy check (no I/O, no database)
 *   - Explicit permission scoping per agent
 *   - Audit logging on every decision (allow / deny)
 */
/**
 * Strongly-typed action catalogue.
 * Every action an AI agent can request must be listed here.
 */
export type ActionType = "ESCALATE" | "PROTECT_POSITION" | "NOTIFY" | "TRIGGER_BUFFER_VAULT";
/**
 * Permission scope assigned to an agent at construction time.
 * Determines which ActionTypes the agent is allowed to request.
 */
export type PermissionScope = "read-only" | "risk-actions" | "full";
/**
 * Result of an authorization check.
 */
export interface GuardDecision {
    authorized: boolean;
    agentId: string;
    actionType: ActionType;
    scope: PermissionScope;
    reason: string;
    timestamp: number;
}
/**
 * Check whether an agent with the given scope is authorized to
 * perform the requested action.
 *
 * Pure, synchronous, deterministic.
 */
export declare function isAuthorized(agentId: string, scope: PermissionScope, actionType: ActionType): GuardDecision;
//# sourceMappingURL=agent.guard.d.ts.map