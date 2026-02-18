/**
 * Shared — Barrel Export
 *
 * Bounded context: Shared
 *
 * Top-level re-export of all shared types, domain, and application
 * abstractions used across protocol bounded contexts.
 */

export {
  type RiskLevel,
  type ExecutionContext,
  type ExecutionPort,
  type SupportedProtocol,
  type ProtocolContext,
  type AgentIdentity,
  type RiskEvent,
  type SecurityValidationResult,
  type ProtocolSecurityAdapter,
  Protocol,
  VALID_PROTOCOLS,
  type Chain,
  VALID_CHAINS,
  DEFAULT_CHAIN,
  type SnapshotKey,
  buildSnapshotKey,
  type MonitorSnapshot,
  stubSnapshot,
} from "./types/index.js";

export {
  type RiskMonitor,
  AaveMonitor,
  CompoundMonitor,
  MorphoMonitor,
  getMonitor,
  registerMonitor,
  registeredProtocols,
  RiskQueryService,
  type RiskHealthDTO,
  type LiquidationPressureDTO,
  type PressureSeverity,
  type HfTrend,
} from "./application/index.js";
