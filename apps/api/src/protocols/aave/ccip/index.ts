/**
 * CCIP — Barrel Export
 *
 * Bounded context: Aave / Cross-Chain Interoperability Protocol
 *
 * Re-exports sender, receiver, and global risk state for CRE pipelines
 * and internal API.
 */

export {
  sendCcipRiskSignal,
  dispatchCrossChainRisk,
  type CcipRiskPayload,
  type CcipSendResult,
} from "./sender.js";

export {
  receiveCcipRiskSignal,
  handleIncomingCrossChainRisk,
  type CcipReceivedMessage,
  type CcipReceiveResult,
} from "./receiver.js";

export {
  getSystemMode,
  activateObserveOnlyMode,
  restoreNormalMode,
  type SystemMode,
} from "./global-risk-state.js";
