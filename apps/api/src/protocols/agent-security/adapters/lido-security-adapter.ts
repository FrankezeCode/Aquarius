/**
 * Lido Security Adapter — Infrastructure Layer
 *
 * Bounded context: Agent Security / Adapters
 *
 * Adapts the abstract ProtocolSecurityAdapter interface to the
 * Lido-specific agent policy guard.
 *
 * DDD role: Infrastructure Adapter (anti-corruption layer).
 *
 * Design:
 *   - Implements the shared ProtocolSecurityAdapter interface
 *   - Delegates to validateLidoAgentExecution for validation
 *   - Does NOT import from Aave or Uniswap bounded contexts
 */

import type { AgentIdentity, ProtocolSecurityAdapter } from "../../shared/types/agent-decision.js";
import { validateLidoAgentExecution } from "../lido/lido-agent-policy.guard.js";
import type { LidoAgent } from "../lido/lido-agent.entity.js";
import type { LidoRiskSnapshot } from "../lido/lido-risk-context.js";

// ── Adapter ──────────────────────────────────────────────────────────

export class LidoSecurityAdapter implements ProtocolSecurityAdapter {
  readonly protocol = "LIDO";

  validate(agent: AgentIdentity, snapshot: unknown): void {
    validateLidoAgentExecution(
      agent as LidoAgent,
      snapshot as LidoRiskSnapshot
    );
  }
}
