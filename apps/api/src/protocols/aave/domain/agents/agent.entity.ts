/**
 * Agent Entity — Domain Layer
 *
 * Bounded context: Aave / Domain
 *
 * Defines the Agent identity and permission model. Every AI agent
 * (internal or external) is represented by this entity.
 *
 * DDD role: Entity (identity + behavior boundary).
 *
 * Design:
 *   - Pure domain types — no infrastructure imports
 *   - AgentScope controls what the agent can do
 *   - canExecuteConfidential gates access to the confidential pipeline
 *   - maxRiskLevel caps the severity of actions the agent can request
 *   - rateLimitPerMinute prevents abuse (enforced at application layer)
 */

import type { RiskLevel } from "../../application/ports/execution.port.js";

// ── Types ────────────────────────────────────────────────────────────

/**
 * Permission scope assigned to an agent. Controls:
 *   - Which execution pipelines the agent can use
 *   - Maximum risk severity the agent can handle
 *   - Rate limiting for abuse prevention
 */
export interface AgentScope {
  /** Whether this agent may use the confidential execution pipeline. */
  canExecuteConfidential: boolean;
  /** Maximum risk level this agent is authorized to act on. */
  maxRiskLevel: RiskLevel;
  /** Maximum actions per minute (enforced at application layer). */
  rateLimitPerMinute: number;
}

/**
 * Agent identity. Every AI agent — internal risk monitors or
 * external partners — is represented by this type.
 */
export interface Agent {
  /** Unique agent identifier. */
  id: string;
  /** Permission scope governing what this agent can do. */
  scope: AgentScope;
}
