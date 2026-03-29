/**
 * Environment configuration (API).
 *
 * Rate limiting (non-test):
 * - RATE_LIMIT_ENABLED — "true" | "false" overrides auto mode (default: off when NODE_ENV=test, else on)
 * - RATE_LIMIT_PUBLIC_MAX — requests/min per IP for /api/v1 (default: 180)
 * - RATE_LIMIT_COPILOT_MAX — requests/min for POST /api/v1/copilot/chat (default: 24)
 * - RATE_LIMIT_INTERNAL_WEBHOOK_MAX — requests/min for /api/internal (default: 480)
 * - RATE_LIMIT_CRE_MAX — requests/min for /api/cre (default: 30)
 */

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseRateLimitEnabled(nodeEnv: string): boolean {
  const explicit = process.env.RATE_LIMIT_ENABLED?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return nodeEnv !== "test";
}

export function loadConfig() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv,
    rateLimitEnabled: parseRateLimitEnabled(nodeEnv),
    rateLimitPublicMax: parsePositiveIntEnv("RATE_LIMIT_PUBLIC_MAX", 180),
    rateLimitCopilotMax: parsePositiveIntEnv("RATE_LIMIT_COPILOT_MAX", 24),
    rateLimitInternalWebhookMax: parsePositiveIntEnv(
      "RATE_LIMIT_INTERNAL_WEBHOOK_MAX",
      480
    ),
    rateLimitCreMax: parsePositiveIntEnv("RATE_LIMIT_CRE_MAX", 30),
  };
}

export type Config = ReturnType<typeof loadConfig>;
