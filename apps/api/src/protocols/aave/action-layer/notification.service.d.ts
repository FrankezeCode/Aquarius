/**
 * Action Layer — Notification Service (Infrastructure)
 *
 * Bounded context: Aave / Action Layer
 *
 * Stub for real-time notifications triggered by escalation events.
 * Console-only for MVP; prepared for webhook / Telegram integration.
 *
 * DDD role: Infrastructure Service — outbound notification channel.
 *
 * Design:
 *   - Synchronous logging (zero I/O cost)
 *   - Non-blocking: no await, no network calls
 *   - Console audit only — production will add:
 *       * Webhook push (Slack, Discord)
 *       * Telegram bot API
 *       * Email via SES / SendGrid
 */
import type { ActionType } from "../agentic-risk/agent.guard.js";
export interface NotificationPayload {
    /** Source agent that initiated the action. */
    agentId: string;
    /** The action type being notified about. */
    actionType: ActionType;
    /** Chain context. */
    chainId: string;
    /** Risk composite score (0..1). */
    composite: number;
    /** Human-readable summary message. */
    message: string;
    /** Unix ms. */
    timestamp: number;
}
/**
 * Send a notification for an escalation event.
 *
 * Synchronous, console-only stub. Non-blocking by design.
 *
 * TODO: Production channels:
 *   - Webhook POST to Slack/Discord
 *   - Telegram Bot API
 *   - Email via SES
 */
export declare function notify(payload: NotificationPayload): void;
//# sourceMappingURL=notification.service.d.ts.map