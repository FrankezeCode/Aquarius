/**
 * Public CRE Adapter — Infrastructure Layer
 *
 * Bounded context: Aave / Infrastructure
 *
 * Implements ExecutionPort for standard (non-confidential) CRE
 * execution. Uses queueMicrotask for non-blocking dispatch.
 *
 * DDD role: Adapter (Hexagonal Architecture) — implements the
 * ExecutionPort defined in the application layer.
 *
 * Design:
 *   - Non-blocking: queueMicrotask fire-and-forget
 *   - No await in the caller's path
 *   - Structured audit logging
 *   - No sensitive data in logs (public pipeline is safe to log)
 *
 * Production TODO:
 *   - Encode payload for Chainlink Functions
 *   - Submit to DON via Functions router contract
 *   - Track execution via CRE job ID
 */

import type {
  ExecutionPort,
  ExecutionContext,
} from "../../application/ports/execution.port.js";

// ── Adapter ──────────────────────────────────────────────────────────

export class PublicCREAdapter implements ExecutionPort {
  async execute(context: ExecutionContext): Promise<void> {
    // Non-blocking dispatch — queueMicrotask ensures the caller
    // (EscalationService) returns immediately.
    queueMicrotask(() => {
      console.info("[Public CRE]", {
        agent: context.agentId,
        action: context.action,
        riskLevel: context.riskLevel,
      });

      // Future: submit to public CRE pipeline
      // await creClient.submitWorkflow({ ... });
    });
  }
}
