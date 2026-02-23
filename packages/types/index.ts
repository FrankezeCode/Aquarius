// ── Legacy domain types ──────────────────────────────────────────────
export type { BaseEvent } from "./events.js";
export type { BaseSignal } from "./signals.js";
export type { SupportedChain } from "./protocols.js";

// ── Risk type hierarchy (canonical) ──────────────────────────────────
export type {
  ProtocolId,
  RiskMetadata,
  RiskSeverity,
  EvaluatableRisk,
} from "./risk/index.js";

export type { AaveRiskSnapshot } from "./risk/index.js";
export type { LidoRiskSnapshot } from "./risk/index.js";
export type { UniswapRiskSnapshot } from "./risk/index.js";

// Health Score system
export type {
  HealthCategory,
  HealthScoreResult,
  RiskInputs,
  ProtocolHealthScore,
  HealthScoreBreakdown,
  HealthScoreMetadata,
  UserHealthScore,
  UserHealthPenalties,
  MarketRegime,
  AIContextInput,
  AIContextResult,
} from "./risk/index.js";

// ── Deprecated — will be removed in next major ──────────────────────
// Re-export old snapshot shape for backward compat during migration.
export type {
  MonitorSnapshot,
  SelvaProtocol,
  SelvaChain,
} from "./snapshot.js";
