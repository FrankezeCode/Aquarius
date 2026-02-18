/**
 * Uniswap Security Adapter — Infrastructure Layer
 *
 * Bounded context: Agent Security / Adapters
 *
 * Adapts the abstract ProtocolSecurityAdapter interface to the
 * Uniswap-specific agent policy guard.
 *
 * DDD role: Infrastructure Adapter (anti-corruption layer).
 *
 * Design:
 *   - Implements the shared ProtocolSecurityAdapter interface
 *   - Delegates to validateUniswapAgentExecution for validation
 *   - Does NOT import from Aave or Lido bounded contexts
 */

import type { AgentIdentity, ProtocolSecurityAdapter } from "../../shared/types/agent-decision.js";
import { validateUniswapAgentExecution } from "../uniswap/uniswap-agent-policy.guard.js";
import type { UniswapAgent } from "../uniswap/uniswap-agent.entity.js";
import type { UniswapRiskSnapshot } from "../uniswap/uniswap-risk-context.js";

// ── Adapter ──────────────────────────────────────────────────────────

export class UniswapSecurityAdapter implements ProtocolSecurityAdapter {
  readonly protocol = "UNISWAP";

  validate(agent: AgentIdentity, snapshot: unknown): void {
    validateUniswapAgentExecution(
      agent as UniswapAgent,
      snapshot as UniswapRiskSnapshot
    );
  }
}
