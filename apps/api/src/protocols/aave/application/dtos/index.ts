/**
 * Application / DTOs — Barrel Export
 *
 * Bounded context: Aave / Application
 *
 * Re-exports all public DTO contracts for the API-as-a-Product layer.
 */

export type { AaveHealthDTO } from "./aave-health.dto.js";
export type {
  LiquidationPressureDTO,
  PressureSeverity,
  HfTrend,
} from "./liquidation-pressure.dto.js";
