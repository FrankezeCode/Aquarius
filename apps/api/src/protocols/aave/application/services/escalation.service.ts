/**
 * Escalation Service — Application Layer (Upgraded)
 *
 * Bounded context: Aave / Application
 *
 * Upgraded escalation service that depends ONLY on:
 *   - ExecutionPort interface (from shared kernel)
 *   - Agent domain types (from aave domain)
 *   - ProtocolSecurityAdapter interface (from shared kernel)
 *
 * It has NO knowledge of:
 *   - Whether execution is public or confidential
 *   - HTTP details or transport mechanisms
 *   - Private Tx logic or encryption
 *   - Which concrete adapter will handle the request
 *   - Uniswap-specific or Lido-specific types
 *
 * Protocol-aware escalation uses injected ProtocolSecurityAdapter
 * instances instead of directly importing protocol-specific guards.
 * This eliminates cross-protocol coupling from the Aave context.
 *
 * DDD role: Application Service — coordinates domain policy
 * with infrastructure execution via dependency inversion.
 *
 * Backward compatibility:
 *   The original action-layer/escalation.service.ts remains untouched.
 *   This upgraded service provides the hybrid execution architecture
 *   for new consumers (external agents, confidential pipelines).
 */

import type {
  ExecutionPort,
  ExecutionContext,
} from "../../../shared/types/execution-context.js";
import type {
  ProtocolContext,
} from "../../../shared/types/protocol-context.js";
import type {
  AgentIdentity,
  ProtocolSecurityAdapter,
} from "../../../shared/types/agent-decision.js";
import { validateAgentExecution } from "../../domain/agents/agent-policy.guard.js";
import type { Agent } from "../../domain/agents/agent.entity.js";

// ── Types ────────────────────────────────────────────────────────────

export interface EscalationOutcome {
  /** Whether the action was validated and dispatched. */
  dispatched: boolean;
  /** Agent that requested the action. */
  agentId: string;
  /** Action that was requested. */
  action: string;
  /** Whether the confidential pipeline was used. */
  confidential: boolean;
  /** Unix ms. */
  timestamp: number;
}

// ── Service ──────────────────────────────────────────────────────────

/**
 * Upgraded EscalationService with hybrid execution support.
 *
 * Usage:
 *   const router = new ExecutionRouter();
 *   const service = new EscalationService(router);
 *   await service.escalate(agent, context);
 *
 * For protocol-aware escalation:
 *   const adapters = [new AaveSecurityAdapter(), new UniswapSecurityAdapter()];
 *   const service = new EscalationService(router, adapters);
 *   await service.escalateWithProtocol(protocolContext, agent, context);
 *
 * The service depends only on abstract interfaces (ExecutionPort,
 * ProtocolSecurityAdapter). No protocol-specific types leak in.
 */
export class EscalationService {
  private readonly executionPort: ExecutionPort;
  private readonly securityAdapters: Map<string, ProtocolSecurityAdapter>;

  /**
   * @param executionPort - Infrastructure adapter for execution routing
   * @param protocolAdapters - Optional array of protocol-specific security
   *   adapters. Each implements the shared ProtocolSecurityAdapter interface.
   *   If not provided, escalateWithProtocol will throw for unknown protocols.
   */
  constructor(
    executionPort: ExecutionPort,
    protocolAdapters: ProtocolSecurityAdapter[] = []
  ) {
    this.executionPort = executionPort;
    this.securityAdapters = new Map(
      protocolAdapters.map((adapter) => [adapter.protocol, adapter])
    );
  }

  /**
   * Validate agent policy and dispatch execution.
   *
   * Flow:
   *   1. validateAgentExecution() — pure domain policy check
   *   2. If violation → throws (fail-fast)
   *   3. Audit log the dispatch
   *   4. executionPort.execute() — routes to correct adapter
   *   5. Return outcome
   *
   * @throws {Error} If agent policy validation fails
   */
  async escalate(
    agent: Agent,
    context: ExecutionContext
  ): Promise<EscalationOutcome> {
    const now = Date.now();

    // 1. Domain policy validation (synchronous, pure, throws on violation)
    validateAgentExecution(agent, context);

    // 2. Audit log
    console.info(
      `[escalation-v2] DISPATCH | agent=${agent.id} action=${context.action} risk=${context.riskLevel} confidential=${context.requiresConfidentiality}`
    );

    // 3. Execute via port (router decides public vs confidential)
    await this.executionPort.execute(context);

    return {
      dispatched: true,
      agentId: agent.id,
      action: context.action,
      confidential: context.requiresConfidentiality,
      timestamp: now,
    };
  }

  // ── Protocol-aware escalation ───────────────────────────────────

  /**
   * Protocol-aware escalation with protocol-specific policy enforcement.
   *
   * Uses injected ProtocolSecurityAdapter instances to delegate policy
   * validation to the correct protocol's security layer. This avoids
   * any cross-protocol imports — the EscalationService depends only on
   * the abstract ProtocolSecurityAdapter interface from the shared kernel.
   *
   * Flow:
   *   1. Look up protocol security adapter by protocol name
   *   2. Run protocol-specific guard (pure, synchronous, throws on violation)
   *   3. Audit log with protocol context
   *   4. Execute via ExecutionPort (same routing as base escalate)
   *   5. Return outcome
   *
   * Backward compatible: the original escalate() method is untouched.
   *
   * @throws {Error} If protocol security adapter is not registered
   * @throws {Error} If protocol-specific policy validation fails
   */
  async escalateWithProtocol(
    protocolContext: ProtocolContext,
    agent: AgentIdentity,
    executionContext: ExecutionContext
  ): Promise<EscalationOutcome> {
    const now = Date.now();

    // 1. Look up the protocol-specific security adapter
    const adapter = this.securityAdapters.get(protocolContext.protocol);
    if (!adapter) {
      throw new Error(
        `No security adapter registered for protocol: ${protocolContext.protocol}`
      );
    }

    // 2. Protocol-specific policy validation (synchronous, pure, throws on violation)
    adapter.validate(agent, protocolContext.snapshot);

    // 3. Audit log with protocol context
    console.info(
      `[escalation-v2] PROTOCOL DISPATCH | protocol=${protocolContext.protocol} ` +
        `action=${executionContext.action} risk=${executionContext.riskLevel} ` +
        `confidential=${executionContext.requiresConfidentiality}`
    );

    // 4. Execute via port (router decides public vs confidential)
    await this.executionPort.execute(executionContext);

    return {
      dispatched: true,
      agentId: executionContext.agentId,
      action: executionContext.action,
      confidential: executionContext.requiresConfidentiality,
      timestamp: now,
    };
  }
}
