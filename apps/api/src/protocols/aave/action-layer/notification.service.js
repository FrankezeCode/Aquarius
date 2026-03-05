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
// ── Public API ───────────────────────────────────────────────────────
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
export function notify(payload) {
    console.info(`[notification] ${payload.actionType} | agent=${payload.agentId} chain=${payload.chainId} composite=${payload.composite} — ${payload.message}`);
}
