import { timingSafeEqual } from "node:crypto";

/**
 * Validates `Authorization: Bearer <token>` against configured allowlist (timing-safe per candidate).
 */
export function matchesVaultIntentBearer(
  authorizationHeader: string | undefined,
  tokens: readonly string[]
): boolean {
  if (tokens.length === 0) return false;
  const raw = authorizationHeader?.trim();
  if (!raw?.toLowerCase().startsWith("bearer ")) return false;
  const presented = raw.slice(7).trim();
  for (const expected of tokens) {
    const a = Buffer.from(presented, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}
