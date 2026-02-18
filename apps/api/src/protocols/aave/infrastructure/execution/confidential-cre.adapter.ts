/**
 * Confidential CRE Adapter — Infrastructure Layer
 *
 * Bounded context: Aave / Infrastructure
 *
 * Implements ExecutionPort for the confidential execution pipeline.
 * This adapter represents the Confidential HTTP boundary — payloads
 * are NOT logged and execution flows through private transaction
 * channels.
 *
 * DDD role: Adapter (Hexagonal Architecture) — implements the
 * ExecutionPort for the privacy-preserving pipeline.
 *
 * Design:
 *   - Non-blocking: queueMicrotask fire-and-forget
 *   - NEVER logs payload content (confidentiality guarantee)
 *   - Only logs agent identity + action type (audit trail)
 *   - Prepared for Confidential HTTP + Private Tx integration
 *
 * Production TODO:
 *   - Inject encrypted payload via Confidential HTTP
 *   - Trigger Private Tx via privacy-preserving relay
 *   - Integrate with TEE (Trusted Execution Environment) if available
 *   - Do NOT log sensitive data — ever
 */

import type {
  ExecutionPort,
  ExecutionContext,
} from "../../application/ports/execution.port.js";

// ── Adapter ──────────────────────────────────────────────────────────

export class ConfidentialCREAdapter implements ExecutionPort {
  async execute(context: ExecutionContext): Promise<void> {
    // Non-blocking dispatch — queueMicrotask ensures the caller
    // (EscalationService) returns immediately.
    queueMicrotask(() => {
      // IMPORTANT: Do NOT log payload — this is a confidential pipeline.
      // Only agent identity and action type are safe to log.
      console.info("[Confidential CRE]", {
        agent: context.agentId,
        action: context.action,
        confidential: true,
      });

      // Future:
      // - Inject encrypted payload
      // - Call Confidential HTTP endpoint
      // - Trigger Private Tx via relay
      // - Do NOT log sensitive data
    });
  }
}
