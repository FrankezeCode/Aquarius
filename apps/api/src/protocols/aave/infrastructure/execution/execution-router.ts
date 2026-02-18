/**
 * Execution Router — Infrastructure Layer
 *
 * Bounded context: Aave / Infrastructure
 *
 * Routes execution requests to the appropriate CRE adapter based on
 * the confidentiality requirement in the ExecutionContext.
 *
 * DDD role: Infrastructure Service — routing decision lives here,
 * NOT in the application layer. The EscalationService only sees
 * the ExecutionPort interface and has no knowledge of which adapter
 * will handle the request.
 *
 * Design:
 *   - Implements ExecutionPort (is itself a valid adapter)
 *   - Routing decision is synchronous (no I/O)
 *   - Adapters are eagerly instantiated (no dynamic imports)
 *   - Composable: can be replaced with a more sophisticated router
 *     (e.g. chain-specific routing) without changing the application layer
 *
 * Routing rules:
 *   context.requiresConfidentiality === true  → ConfidentialCREAdapter
 *   context.requiresConfidentiality === false → PublicCREAdapter
 */

import type {
  ExecutionPort,
  ExecutionContext,
} from "../../application/ports/execution.port.js";
import { PublicCREAdapter } from "./public-cre.adapter.js";
import { ConfidentialCREAdapter } from "./confidential-cre.adapter.js";

// ── Router ───────────────────────────────────────────────────────────

export class ExecutionRouter implements ExecutionPort {
  // Eagerly instantiated — no dynamic imports, no lazy loading overhead
  private readonly publicAdapter = new PublicCREAdapter();
  private readonly confidentialAdapter = new ConfidentialCREAdapter();

  async execute(context: ExecutionContext): Promise<void> {
    if (context.requiresConfidentiality) {
      return this.confidentialAdapter.execute(context);
    }

    return this.publicAdapter.execute(context);
  }
}
