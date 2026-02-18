/**
 * Application / Services — Barrel Export
 *
 * Bounded context: Aave / Application
 *
 * Re-exports application services.
 */

export {
  EscalationService,
  type EscalationOutcome,
} from "./escalation.service.js";

export { AaveRiskQueryService } from "./aave-risk-query.service.js";
