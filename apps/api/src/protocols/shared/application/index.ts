/**
 * Shared / Application — Barrel Export
 */

export type { RiskMonitor } from "./monitors/index.js";
export type { MonitorSnapshot } from "./monitors/index.js";
export { AaveMonitor } from "./monitors/index.js";
export { CompoundMonitor } from "./monitors/index.js";
export { MorphoMonitor } from "./monitors/index.js";
export {
  getMonitor,
  registerMonitor,
  registeredProtocols,
} from "./monitors/index.js";

export {
  RiskQueryService,
  type RiskHealthDTO,
  type LiquidationPressureDTO,
  type PressureSeverity,
  type HfTrend,
} from "./services/index.js";
