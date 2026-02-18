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

// ── Types ────────────────────────────────────────────────────────────

/**
 * Strongly-typed action catalogue.
 * Every action an AI agent can request must be listed here.
 */
export type ActionType =
  | "ESCALATE"
  | "PROTECT_POSITION"
  | "NOTIFY"
  | "TRIGGER_BUFFER_VAULT";

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

// ── Permission matrix ────────────────────────────────────────────────
//
// Maps each scope to the set of actions it may perform.
// "full" is a superset — production systems should use narrower scopes.

const SCOPE_PERMISSIONS: Record<PermissionScope, ReadonlySet<ActionType>> = {
  "read-only": new Set<ActionType>([]),
  "risk-actions": new Set<ActionType>(["ESCALATE", "NOTIFY", "PROTECT_POSITION"]),
  full: new Set<ActionType>([
    "ESCALATE",
    "PROTECT_POSITION",
    "NOTIFY",
    "TRIGGER_BUFFER_VAULT",
  ]),
};

// ── Public API ───────────────────────────────────────────────────────

/**
 * Check whether an agent with the given scope is authorized to
 * perform the requested action.
 *
 * Pure, synchronous, deterministic.
 */
export function isAuthorized(
  agentId: string,
  scope: PermissionScope,
  actionType: ActionType
): GuardDecision {
  const allowed = SCOPE_PERMISSIONS[scope];
  const authorized = allowed.has(actionType);

  const decision: GuardDecision = {
    authorized,
    agentId,
    actionType,
    scope,
    reason: authorized
      ? `Agent "${agentId}" authorized for ${actionType} under scope "${scope}"`
      : `Agent "${agentId}" DENIED ${actionType} — scope "${scope}" does not permit this action`,
    timestamp: Date.now(),
  };

  // Audit log — every guard decision is recorded
  console.info(
    `[agent-guard] ${authorized ? "ALLOW" : "DENY"} | agent=${agentId} action=${actionType} scope=${scope}`
  );

  return decision;
}
