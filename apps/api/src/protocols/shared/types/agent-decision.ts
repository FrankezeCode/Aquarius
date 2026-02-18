/**
 * Shared Agent Decision Types
 *
 * Bounded context: Shared / Types
 *
 * Abstract interfaces for agent identity, risk events, and
 * security policies used across protocol bounded contexts.
 * No concrete protocol logic allowed.
 *
 * DDD role: Shared Kernel (types only, no logic).
 */

// ── Types ────────────────────────────────────────────────────────────

/** Abstract agent identity used by the security layer. */
export interface AgentIdentity {
  /** Unique agent identifier. */
  id: string;
}

/** Abstract risk event for cross-protocol security enforcement. */
export interface RiskEvent {
  /** Protocol that originated the event. */
  protocol: string;
  /** Opaque snapshot data — narrowed by each protocol. */
  snapshot: unknown;
}

/** Abstract security policy validation result. */
export interface SecurityValidationResult {
  /** Whether the agent is authorized. */
  authorized: boolean;
  /** Reason if unauthorized. */
  reason?: string;
}

/**
 * Protocol-specific security adapter interface.
 *
 * Each protocol implements this to provide its own policy enforcement.
 * The agent-security bounded context depends on this interface,
 * NOT on concrete protocol types.
 */
export interface ProtocolSecurityAdapter {
  /** The protocol this adapter handles. */
  readonly protocol: string;
  /** Validate agent execution against the protocol's risk snapshot. */
  validate(agent: AgentIdentity, snapshot: unknown): void;
}
