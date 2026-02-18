/**
 * CCIP — Receiver (Infrastructure Layer)
 *
 * Bounded context: Aave / Cross-Chain Interoperability Protocol
 *
 * Stub implementation for receiving cross-chain risk signals via
 * Chainlink CCIP.
 *
 * In production this will:
 *   1. Decode an incoming CCIP message
 *   2. Validate the sender & source chain selector
 *   3. Forward the decoded risk signal into the local monitor pipeline
 *
 * Current behaviour: parse, log, toggle global risk state on critical.
 * No on-chain interaction.
 */

import type { CcipRiskPayload } from "./sender.js";
import type { CrossChainRiskSignal } from "../risk-intelligence/domain-events.js";
import { activateObserveOnlyMode } from "./global-risk-state.js";

// ── Types ────────────────────────────────────────────────────────────

export interface CcipReceivedMessage {
  /** Mock CCIP message ID from the source chain. */
  messageId: string;
  /** Decoded risk payload. */
  payload: CcipRiskPayload;
  /** Chain that sent the message. */
  sourceChainId: string;
  /** Unix ms when the message was received locally. */
  receivedAt: number;
}

export interface CcipReceiveResult {
  status: "stub-received";
  message: CcipReceivedMessage;
}

// ── Cross-Chain Domain Event Handler ─────────────────────────────────

/**
 * Handle an incoming cross-chain risk signal (domain event).
 *
 * Activates observe-only mode if the signal is critical, preventing
 * automated actions until the situation is assessed.
 *
 * Production TODO:
 *   - Wire to CCIP receiver contract's `ccipReceive` callback
 *   - Decode ABI-encoded bytes into CrossChainRiskSignal
 *   - Validate allowlisted source chains & senders
 *   - Forward into local risk pipeline for re-assessment
 */
export function handleIncomingCrossChainRisk(
  signal: CrossChainRiskSignal
): void {
  console.info(
    `[ccip-receiver] incoming cross-chain risk | from=${signal.sourceChain} level=${signal.riskLevel} composite=${signal.composite}`
  );

  if (signal.riskLevel === "critical") {
    activateObserveOnlyMode();
  }

  // Future: forward signal into local risk-intelligence pipeline
  // so the receiving chain can re-assess its own positions with
  // cross-chain context.
}

// ── Legacy Stub (direct callers / tests) ─────────────────────────────

/**
 * Simulate receiving a CCIP risk signal from another chain.
 *
 * Production TODO:
 *   - Wire to CCIP receiver contract's `ccipReceive` callback
 *   - Decode ABI-encoded bytes into CcipRiskPayload
 *   - Validate allowlisted source chains & senders
 */
export async function receiveCcipRiskSignal(
  messageId: string,
  payload: CcipRiskPayload
): Promise<CcipReceiveResult> {
  const receivedMessage: CcipReceivedMessage = {
    messageId,
    payload,
    sourceChainId: payload.sourceChainId,
    receivedAt: Date.now(),
  };

  console.info(
    `[ccip-receiver] STUB received | messageId=${messageId} from=${payload.sourceChainId} level=${payload.riskLevel}`
  );

  return {
    status: "stub-received",
    message: receivedMessage,
  };
}
