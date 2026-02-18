/**
 * Aave Security Adapter — Infrastructure Layer
 *
 * Bounded context: Agent Security / Adapters
 *
 * Adapts the abstract ProtocolSecurityAdapter interface to the
 * Aave-specific agent policy guard. This adapter bridges the
 * protocol-agnostic agent-security domain with the Aave-specific
 * policy enforcement rules.
 *
 * DDD role: Infrastructure Adapter (anti-corruption layer).
 *
 * Design:
 *   - Implements the shared ProtocolSecurityAdapter interface
 *   - Delegates to validateAaveAgentExecution for actual validation
 *   - Casts the opaque agent/snapshot to Aave-specific types
 *   - Does NOT import from Uniswap or Lido bounded contexts
 */

import type { AgentIdentity, ProtocolSecurityAdapter } from "../../shared/types/agent-decision.js";
import { validateAaveAgentExecution } from "../aave/aave-agent-policy.guard.js";
import type { AaveAgent } from "../aave/aave-agent.entity.js";
import type { AaveRiskSnapshot } from "../aave/aave-risk-context.js";

// ── Adapter ──────────────────────────────────────────────────────────

export class AaveSecurityAdapter implements ProtocolSecurityAdapter {
  readonly protocol = "AAVE";

  validate(agent: AgentIdentity, snapshot: unknown): void {
    validateAaveAgentExecution(
      agent as AaveAgent,
      snapshot as AaveRiskSnapshot
    );
  }
}
