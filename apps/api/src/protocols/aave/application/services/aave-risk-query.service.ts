/**
 * @deprecated Use RiskQueryService from protocols/shared/application/services
 * instead.  This file is preserved for backward compatibility only.
 *
 * The multi-protocol RiskQueryService now handles all read-only
 * projections with concurrency-safe lazy refresh and TTL.
 */

export { RiskQueryService as AaveRiskQueryService } from "../../../shared/application/services/risk-query.service.js";
