/**
 * Action Layer — Barrel Export
 *
 * Bounded context: Aave / Action Layer
 *
 * Re-exports escalation service, CRE adapter, and notification
 * service for AI agent and application-layer consumers.
 */

export {
  requestAction,
  type EscalationRequest,
  type EscalationResult,
} from "./escalation.service.js";

export { triggerCRE, type CREActionPayload } from "./cre-adapter.js";

export { notify, type NotificationPayload } from "./notification.service.js";
