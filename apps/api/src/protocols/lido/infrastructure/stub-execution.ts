/**
 * Lido Stub Execution — Infrastructure Layer
 *
 * Bounded context: Lido / Infrastructure
 *
 * In-memory execution simulation for the Lido bounded context.
 * Replaces CRE calls with console-based audit logging.
 *
 * // CRE integration layer (future)
 *
 * DDD role: Infrastructure Adapter (stub).
 */

import type { ExecutionPort, ExecutionContext } from "../../shared/types/execution-context.js";

export class LidoStubExecution implements ExecutionPort {
  async execute(context: ExecutionContext): Promise<void> {
    // CRE integration layer (future)
    queueMicrotask(() => {
      console.info("[Lido Stub Execution]", {
        agent: context.agentId,
        action: context.action,
        riskLevel: context.riskLevel,
      });
    });
  }
}
