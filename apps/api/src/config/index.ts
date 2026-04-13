/**
 * Environment configuration (API).
 *
 * Rate limiting (non-test):
 * - RATE_LIMIT_ENABLED — "true" | "false" overrides auto mode (default: off when NODE_ENV=test, else on)
 * - RATE_LIMIT_PUBLIC_MAX — requests/min per IP for /api/v1 (default: 180)
 * - RATE_LIMIT_COPILOT_MAX — requests/min for POST /api/v1/copilot/chat (default: 24)
 * - RATE_LIMIT_INTERNAL_WEBHOOK_MAX — requests/min for /api/internal (default: 480)
 * - RATE_LIMIT_CRE_MAX — requests/min for /api/cre (default: 30)
 * - RATE_LIMIT_KAMINO_WRITE_MAX — requests/min for POST /api/v1/kamino-risk/repay/simulate (default: 24)
 *
 * Kamino / Solana (read path):
 * - SOLANA_RPC_URL — HTTPS RPC URL (optional; required for live Kamino reads)
 * - SOLANA_CLUSTER — mainnet-beta | devnet | testnet (default: mainnet-beta)
 * - KAMINO_MARKET_PUBKEY — optional default lending market (base58)
 * - SOLANA_RPC_TIMEOUT_MS — per-RPC-call timeout (default: 12000)
 * - KAMINO_CIRCUIT_FAILURE_THRESHOLD — consecutive failures before open (default: 5)
 * - KAMINO_CIRCUIT_OPEN_MS — how long circuit stays open (default: 30000)
 * - KAMINO_RECENT_SLOT_DURATION_MS — passed to Klend KaminoMarket.load (default: 400)
 * - KAMINO_READ_ENABLED — force enable/disable live reads (default: on when SOLANA_RPC_URL set and NODE_ENV≠test)
 * - KAMINO_MARKET_LOAD_CACHE_TTL_MS — TTL for in-process KaminoMarket.load cache (default: 60000; 0 disables)
 * - KAMINO_CRE_STALE_SNAPSHOT — "true"|"false" allow last-good snapshot on RPC failure in CRE (default: false in test, true otherwise)
 * - KAMINO_STALE_SNAPSHOT_MAX_AGE_MS — max age for stale fallback (default: 300000)
 * - KAMINO_CRE_BACKGROUND_REFRESH — "true"|"false" enqueue async live fetch after stale CRE response to warm cache (default: false in test, true otherwise)
 *
 * Kamino write / mitigation (Phase D):
 * - KAMINO_WRITE_ENABLED — repay dry-run/simulation (default: off in test; on when set true)
 * - KAMINO_REPAY_SIMULATE_TIMEOUT_MS — RPC timeout for simulateTransaction (default: 20000)
 * - KAMINO_MAX_REPAY_UI — max token amount (human / UI string) allowed per dry-run request (default: 1e9)
 * - KAMINO_ALLOWED_REPAY_MINTS — optional comma-separated base58 mint allowlist (empty = any)
 */

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

/** Integer ≥ 0 (0 is valid). */
function parseNonNegativeIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function parseRateLimitEnabled(nodeEnv: string): boolean {
  const explicit = process.env.RATE_LIMIT_ENABLED?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return nodeEnv !== "test";
}

function parseSolanaCluster():
  | "mainnet-beta"
  | "devnet"
  | "testnet" {
  const raw = process.env.SOLANA_CLUSTER?.trim().toLowerCase();
  if (raw === "devnet") return "devnet";
  if (raw === "testnet") return "testnet";
  return "mainnet-beta";
}

function parseKaminoReadEnabled(nodeEnv: string): boolean {
  const explicit = process.env.KAMINO_READ_ENABLED?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  const hasUrl = Boolean(process.env.SOLANA_RPC_URL?.trim());
  return hasUrl && nodeEnv !== "test";
}

function parseKaminoWriteEnabled(nodeEnv: string): boolean {
  const explicit = process.env.KAMINO_WRITE_ENABLED?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return nodeEnv !== "test" && Boolean(process.env.SOLANA_RPC_URL?.trim());
}

function parseKaminoCreStaleSnapshotEnabled(nodeEnv: string): boolean {
  const explicit = process.env.KAMINO_CRE_STALE_SNAPSHOT?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return nodeEnv !== "test";
}

function parseKaminoCreBackgroundRefreshEnabled(nodeEnv: string): boolean {
  const explicit = process.env.KAMINO_CRE_BACKGROUND_REFRESH?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return nodeEnv !== "test";
}

function parseAllowedRepayMints(): Set<string> | null {
  const raw = process.env.KAMINO_ALLOWED_REPAY_MINTS?.trim();
  if (!raw) return null;
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return set.size > 0 ? set : null;
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
    rateLimitKaminoWriteMax: parsePositiveIntEnv(
      "RATE_LIMIT_KAMINO_WRITE_MAX",
      24
    ),

    solanaRpcUrl: process.env.SOLANA_RPC_URL?.trim() || undefined,
    solanaCluster: parseSolanaCluster(),
    kaminoDefaultMarketPubkey:
      process.env.KAMINO_MARKET_PUBKEY?.trim() || undefined,
    kaminoReadEnabled: parseKaminoReadEnabled(nodeEnv),
    kaminoRpcTimeoutMs: parsePositiveIntEnv("SOLANA_RPC_TIMEOUT_MS", 12_000),
    kaminoCircuitFailureThreshold: parsePositiveIntEnv(
      "KAMINO_CIRCUIT_FAILURE_THRESHOLD",
      5
    ),
    kaminoCircuitOpenMs: parsePositiveIntEnv("KAMINO_CIRCUIT_OPEN_MS", 30_000),
    kaminoRecentSlotMs: parsePositiveIntEnv(
      "KAMINO_RECENT_SLOT_DURATION_MS",
      400
    ),
    kaminoMarketLoadCacheTtlMs: parseNonNegativeIntEnv(
      "KAMINO_MARKET_LOAD_CACHE_TTL_MS",
      60_000
    ),
    kaminoCreStaleSnapshotEnabled: parseKaminoCreStaleSnapshotEnabled(nodeEnv),
    kaminoStaleSnapshotMaxAgeMs: parsePositiveIntEnv(
      "KAMINO_STALE_SNAPSHOT_MAX_AGE_MS",
      300_000
    ),
    kaminoCreBackgroundRefreshEnabled:
      parseKaminoCreBackgroundRefreshEnabled(nodeEnv),

    kaminoWriteEnabled: parseKaminoWriteEnabled(nodeEnv),
    kaminoRepaySimulateTimeoutMs: parsePositiveIntEnv(
      "KAMINO_REPAY_SIMULATE_TIMEOUT_MS",
      20_000
    ),
    /** Human/UI amount string upper bound (decimal string compared lexicographically as number). */
    kaminoMaxRepayUi: process.env.KAMINO_MAX_REPAY_UI?.trim() || "1000000000",
    kaminoAllowedRepayMints: parseAllowedRepayMints(),
  };
}

export type Config = ReturnType<typeof loadConfig>;
