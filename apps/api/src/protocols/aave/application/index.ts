/**
 * Application Layer — Barrel Export
 *
 * Bounded context: Aave / Application
 *
 * Re-exports ports and services for infrastructure and consumer use.
 */

export {
  type ExecutionPort,
  type ExecutionContext,
  type RiskLevel,
} from "./ports/index.js";

export {
  EscalationService,
  type EscalationOutcome,
  AaveRiskQueryService,
} from "./services/index.js";

export type {
  AaveHealthDTO,
  LiquidationPressureDTO,
  PressureSeverity,
  HfTrend,
} from "./dtos/index.js";
