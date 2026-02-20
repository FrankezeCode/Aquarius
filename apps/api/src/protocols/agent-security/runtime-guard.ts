/**
 * Agent Security — Runtime Protocol Isolation Guard
 *
 * Enforces protocol boundary integrity at runtime.
 * Prevents cross-protocol mutation by validating that
 * an agent's context matches the protocol it's operating on.
 *
 * Call assertProtocolIsolation() at every agent action boundary
 * to ensure strict isolation between protocol contexts.
 *
 * DDD role: Domain service — enforces invariant.
 */

import type { SupportedProtocol } from "./protocol-context.js";

export interface ProtocolIsolationContext {
  agentId: string;
  agentProtocol: SupportedProtocol;
  targetProtocol: SupportedProtocol;
  action: string;
}

export class ProtocolIsolationViolation extends Error {
  public readonly context: ProtocolIsolationContext;

  constructor(context: ProtocolIsolationContext) {
    super(
      `Protocol isolation violation: agent '${context.agentId}' ` +
      `(protocol=${context.agentProtocol}) attempted '${context.action}' ` +
      `on protocol '${context.targetProtocol}'`
    );
    this.name = "ProtocolIsolationViolation";
    this.context = context;
  }
}

/**
 * Assert that an agent is operating within its own protocol boundary.
 * Throws ProtocolIsolationViolation if the agent attempts to
 * access a different protocol's context.
 *
 * This is a synchronous, zero-cost check (string comparison).
 */
export function assertProtocolIsolation(
  context: ProtocolIsolationContext
): void {
  if (context.agentProtocol !== context.targetProtocol) {
    const violation = new ProtocolIsolationViolation(context);

    console.error(
      `[agent-security] VIOLATION: ${violation.message}`
    );

    throw violation;
  }
}

/**
 * Non-throwing version for monitoring / metrics.
 * Returns true if the action is within bounds.
 */
export function checkProtocolIsolation(
  context: ProtocolIsolationContext
): boolean {
  if (context.agentProtocol !== context.targetProtocol) {
    console.warn(
      `[agent-security] Boundary check failed: agent '${context.agentId}' ` +
      `(${context.agentProtocol}) → ${context.targetProtocol}:${context.action}`
    );
    return false;
  }
  return true;
}

// ── Scoped DI Container Guard ────────────────────────────────────────

const protocolContainers = new Map<SupportedProtocol, Set<string>>();

/**
 * Register a service instance as belonging to a specific protocol.
 * Used by the DI bootstrap to enforce container scoping.
 */
export function registerProtocolService(
  protocol: SupportedProtocol,
  serviceId: string
): void {
  if (!protocolContainers.has(protocol)) {
    protocolContainers.set(protocol, new Set());
  }
  protocolContainers.get(protocol)!.add(serviceId);
}

/**
 * Verify that a service belongs to the expected protocol container.
 * Returns false if the service is registered under a different protocol.
 */
export function isServiceInScope(
  protocol: SupportedProtocol,
  serviceId: string
): boolean {
  const container = protocolContainers.get(protocol);
  if (!container) return false;

  // Check it's in our container AND not in any other
  if (!container.has(serviceId)) return false;

  for (const [p, c] of protocolContainers) {
    if (p !== protocol && c.has(serviceId)) {
      console.warn(
        `[agent-security] Service '${serviceId}' registered in multiple protocols: ${p}, ${protocol}`
      );
      return false;
    }
  }

  return true;
}
