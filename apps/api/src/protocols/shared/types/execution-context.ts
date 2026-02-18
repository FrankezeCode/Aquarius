/**
 * Shared Execution Context Types
 *
 * Bounded context: Shared / Types
 *
 * Cross-protocol execution abstractions used by all bounded contexts.
 * These types are protocol-agnostic — no protocol-specific logic allowed.
 *
 * Any protocol that needs to produce or consume execution decisions
 * imports from here, avoiding cross-protocol coupling.
 *
 * DDD role: Shared Kernel (types only, no logic).
 */

// ── Types ────────────────────────────────────────────────────────────

/** Risk severity hierarchy used for agent policy enforcement. */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Execution context passed from the application layer to the
 * infrastructure adapter. Contains everything needed to execute
 * an action without the adapter needing domain knowledge.
 */
export interface ExecutionContext {
  /** ID of the agent requesting execution. */
  agentId: string;
  /** The authorized action to perform. */
  action: string;
  /** Action-specific payload (opaque to the port). */
  payload: unknown;
  /** Whether this execution requires the confidential pipeline. */
  requiresConfidentiality: boolean;
  /** Risk severity of the action being executed. */
  riskLevel: RiskLevel;
}

/**
 * Execution port — the single interface through which the application
 * layer dispatches actions to infrastructure.
 */
export interface ExecutionPort {
  execute(context: ExecutionContext): Promise<void>;
}
