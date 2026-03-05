/**
 * Action Layer — CRE Adapter (Infrastructure)
 *
 * Bounded context: Aave / Action Layer
 *
 * Stub adapter for triggering Chainlink Runtime Environment (CRE)
 * workflows from the action layer. Non-blocking via queueMicrotask.
 *
 * DDD role: Infrastructure Adapter — translates action-layer commands
 * into CRE-specific calls.
 *
 * Design:
 *   - Returns void (fire-and-forget)
 *   - No await, no Promise return
 *   - Uses queueMicrotask to avoid blocking the caller
 *   - Console audit logging only
 *
 * TODO: Future integration with real CRE pipelines via Chainlink
 *       Functions or direct DON trigger.
 */
import type { ActionType } from "../agentic-risk/agent.guard.js";
export interface CREActionPayload {
    /** Which agent requested this action. */
    agentId: string;
    /** The authorized action type. */
    actionType: ActionType;
    /** Chain-specific context. */
    chainId: string;
    /** Risk composite score that triggered the action (0..1). */
    composite: number;
    /** Additional metadata for the CRE workflow. */
    metadata: Record<string, unknown>;
    /** Unix ms. */
    timestamp: number;
}
/**
 * Trigger a CRE workflow for the given action.
 *
 * Non-blocking — uses queueMicrotask so the caller (escalation service)
 * returns immediately. The CRE trigger runs outside the HTTP request
 * lifecycle.
 *
 * TODO: Replace console stub with real CRE pipeline invocation:
 *   - Encode payload for Chainlink Functions
 *   - Submit to DON via Functions router contract
 *   - Track execution via CRE job ID
 */
export declare function triggerCRE(payload: CREActionPayload): void;
//# sourceMappingURL=cre-adapter.d.ts.map