/**
 * Application / Ports — Barrel Export
 *
 * Bounded context: Aave / Application
 *
 * Re-exports port interfaces for dependency injection.
 */

export {
  type ExecutionPort,
  type ExecutionContext,
  type RiskLevel,
} from "./execution.port.js";
