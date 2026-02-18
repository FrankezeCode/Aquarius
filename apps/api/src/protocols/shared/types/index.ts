/**
 * Shared Types — Barrel Export
 *
 * Bounded context: Shared
 *
 * Re-exports all shared type definitions used across protocol
 * bounded contexts. Consumers import from here to avoid
 * cross-protocol coupling.
 */

export {
  type RiskLevel,
  type ExecutionContext,
  type ExecutionPort,
} from "./execution-context.js";

export {
  type SupportedProtocol,
  type ProtocolContext,
} from "./protocol-context.js";

export {
  type AgentIdentity,
  type RiskEvent,
  type SecurityValidationResult,
  type ProtocolSecurityAdapter,
} from "./agent-decision.js";

export {
  Protocol,
  VALID_PROTOCOLS,
  type Chain,
  VALID_CHAINS,
  DEFAULT_CHAIN,
  type SnapshotKey,
  buildSnapshotKey,
} from "./risk-api.types.js";

export {
  type MonitorSnapshot,
  stubSnapshot,
} from "./monitor-snapshot.types.js";
