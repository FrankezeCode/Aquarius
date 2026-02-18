/**
 * CCIP — Sender (Infrastructure Layer)
 *
 * Bounded context: Aave / Cross-Chain Interoperability Protocol
 *
 * Infrastructure implementation for sending risk signals via
 * Chainlink CCIP. Consumes domain events (CrossChainRiskSignal)
 * emitted by the risk-intelligence domain layer.
 *
 * In production this will:
 *   1. Encode the payload using CCIP message format
 *   2. Submit a CCIP send transaction to the router contract
 *   3. Return the CCIP message ID for tracking
 *
 * Current behaviour: validates input, logs the signal, returns a mock
 * message ID.  Zero external dependencies.
 *
 * PERFORMANCE:
 *   - dispatchCrossChainRisk() is NON-BLOCKING (fire-and-forget)
 *   - sendCcipRiskSignal() is the async stub for direct callers
 */

import type { CrossChainRiskSignal } from "../risk-intelligence/domain-events.js";

// ── Types ────────────────────────────────────────────────────────────

export interface CcipRiskPayload {
  /** Chain where the risk was detected. */
  sourceChainId: string;
  /** ACE risk classification. */
  riskLevel: string;
  /** Numeric composite score 0..1. */
  composite: number;
  /** Action taken by the monitor (escalate | pause). */
  action: string;
  /** Unix ms. */
  timestamp: number;
}

export interface CcipSendResult {
  /** Mock CCIP message ID. */
  messageId: string;
  /** Status of the stub call. */
  status: "stub-ok";
  /** Echo of the payload for logging. */
  payload: CcipRiskPayload;
}

// ── Low-Latency Dispatch (fire-and-forget) ───────────────────────────

/**
 * Non-blocking cross-chain risk dispatch.
 *
 * Called by the application layer (cre-webhook) when the domain emits
 * a CrossChainRiskSignal. Uses queueMicrotask to avoid blocking the
 * HTTP response lifecycle.
 *
 * Returns void — callers must NOT await this.
 *
 * Production TODO:
 *   - Encode signal as ABI bytes
 *   - Submit via Router.ccipSend()
 *   - Push to dead-letter queue on failure
 */
export function dispatchCrossChainRisk(signal: CrossChainRiskSignal): void {
  queueMicrotask(() => {
    const messageId = `ccip-${signal.sourceChain}-${signal.timestamp}`;
    console.info(
      `[ccip-sender] dispatch | messageId=${messageId} chain=${signal.sourceChain} level=${signal.riskLevel} composite=${signal.composite}`
    );

    // Future: encode + send via ethers to CCIP router contract
    // Future: emit to observability / dead-letter on failure
  });
}

// ── Async Stub (legacy / direct callers) ─────────────────────────────

/**
 * Send a risk signal via CCIP (stub).
 *
 * Production TODO:
 *   - Integrate with @chainlink/ccip SDK
 *   - Encode payload as abi-encoded bytes
 *   - Call Router.ccipSend(destinationChainSelector, message)
 */
export async function sendCcipRiskSignal(
  payload: CcipRiskPayload
): Promise<CcipSendResult> {
  // Generate a deterministic mock message ID for traceability
  const messageId = `ccip-stub-${payload.sourceChainId}-${payload.timestamp}`;

  console.info(
    `[ccip-sender] STUB dispatch | messageId=${messageId} chain=${payload.sourceChainId} level=${payload.riskLevel} action=${payload.action}`
  );

  return {
    messageId,
    status: "stub-ok",
    payload,
  };
}
