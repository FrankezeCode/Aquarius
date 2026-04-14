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
 * - RATE_LIMIT_VAULT_GATEWAY_INTENTS_MAX — requests/min for POST /api/v1/vault-gateway/intents (default: 24)
 *
 * Vault gateway execution (POST intents):
 * - VAULT_GATEWAY_EXECUTION_ENABLED — "true" | "false" (default: false)
 * - VAULT_GATEWAY_INTENT_TOKEN — single Bearer secret (or use VAULT_GATEWAY_INTENT_TOKENS comma-separated)
 * - ORCHESTRATION_EXECUTION_MODE — "mock" | omit — mock skips real CRE I/O (local/dev)
 * - VAULT_GATEWAY_IDEMPOTENCY_TTL_MS — idempotency key retention (default: 86400000)
 * - REDIS_URL or VAULT_ORCHESTRATION_REDIS_URL — optional; enables Redis-backed job + idempotency store
 * - ORCHESTRATION_JOB_TTL_SECONDS — Redis TTL for job records (default: 604800)
 * - VAULT_INTENT_CRE_WORKFLOW_ID — override mapped workflow id (default: aave-risk-monitor)
 * - CRE_VAULT_WORKFLOW_TRIGGER_URL — optional; POST to start remote CRE run (vault stays running until webhook)
 * - CRE_VAULT_WORKFLOW_TRIGGER_TOKEN — Bearer for trigger URL
 * - CRE_VAULT_WORKFLOW_TRIGGER_TIMEOUT_MS — (default: 10000)
 * - VAULT_CRE_CALLBACK_URL — optional callback URL sent to remote trigger
 * - INTERNAL_VAULT_JOB_CALLBACK_SECRET — shared secret for POST /api/internal/vault-gateway/cre-job-callback
 * - VAULT_PROTOCOL_SIMULATED_OWNER — hex address used as vault owner for simulated buffer top-up (default: deterministic dev address)
 *
 * Buffer solvency (internal metrics / Phase 6):
 * - BUFFER_MINIMUM_TVL_USD — policy floor for TVL (default: 0 in test, 10000 otherwise)
 * - BUFFER_DRAWDOWN_WARNING_PCT — drawdown vs previous snapshot → warning (default: 5)
 * - BUFFER_REFILL_ASSUMED_USD_PER_HOUR — time-to-refill proxy (default: 10000)
 * - BUFFER_STRESS_DRAW_USD_PER_HOUR — default stress drain for projections (default: 5000)
 * - BUFFER_STRESS_HORIZON_HOURS — default horizon (default: 24)
 * - BUFFER_USD_PER_UNIT_JSON — optional JSON overrides for stub USD/unit, e.g. {"ETH":3000,"USDC":1}
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

function parseBufferMinimumTvlUsd(nodeEnv: string): number {
  const raw = process.env.BUFFER_MINIMUM_TVL_USD?.trim();
  if (raw !== undefined && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return nodeEnv === "test" ? 0 : 10_000;
}

function parseBufferDrawdownWarningPct(): number {
  const raw = process.env.BUFFER_DRAWDOWN_WARNING_PCT?.trim();
  if (!raw) return 5;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) return 5;
  return n;
}

function parseBufferPositiveFloat(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function parseBufferUsdPerUnitOverrides(): Partial<
  Record<
    "ETH" | "WETH" | "POL" | "USDC" | "USDT" | "DAI" | "WBTC",
    number
  >
> {
  const raw = process.env.BUFFER_USD_PER_UNIT_JSON?.trim();
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const keys = [
      "ETH",
      "WETH",
      "POL",
      "USDC",
      "USDT",
      "DAI",
      "WBTC",
    ] as const;
    const out: Partial<Record<(typeof keys)[number], number>> = {};
    for (const k of keys) {
      const v = o[k];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        out[k] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
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

function parseOrchestrationExecutionMode(): "live" | "mock" {
  const raw = process.env.ORCHESTRATION_EXECUTION_MODE?.trim().toLowerCase();
  if (raw === "mock") return "mock";
  return "live";
}

/** Curated PoS delegation adapter: mock (CI) vs testnet write. */
function parsePosDelegationExecutionMode(): "mock" | "testnet" {
  const raw = process.env.POS_DELEGATION_EXECUTION_MODE?.trim().toLowerCase();
  if (raw === "testnet") return "testnet";
  return "mock";
}

function parsePosDelegationEnabledChains(): Set<string> {
  const raw = process.env.POS_DELEGATION_ENABLED_CHAINS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** ADR 0003: production defaults to off; set `true` to enable POST /vault-gateway/intents. */
function parseVaultGatewayExecutionEnabled(): boolean {
  return process.env.VAULT_GATEWAY_EXECUTION_ENABLED?.trim().toLowerCase() === "true";
}

function parseVaultGatewayIntentTokens(): string[] {
  const multi = process.env.VAULT_GATEWAY_INTENT_TOKENS?.trim();
  const single = process.env.VAULT_GATEWAY_INTENT_TOKEN?.trim();
  if (multi) {
    return multi.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (single) return [single];
  return [];
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
    rateLimitVaultGatewayIntentsMax: parsePositiveIntEnv(
      "RATE_LIMIT_VAULT_GATEWAY_INTENTS_MAX",
      24
    ),

    orchestrationExecutionMode: parseOrchestrationExecutionMode(),
    vaultGatewayExecutionEnabled: parseVaultGatewayExecutionEnabled(),
    vaultGatewayIntentTokens: parseVaultGatewayIntentTokens(),
    vaultGatewayIdempotencyTtlMs: parsePositiveIntEnv(
      "VAULT_GATEWAY_IDEMPOTENCY_TTL_MS",
      86_400_000
    ),

    orchestrationRedisUrl:
      process.env.REDIS_URL?.trim() ||
      process.env.VAULT_ORCHESTRATION_REDIS_URL?.trim() ||
      undefined,
    orchestrationJobTtlSeconds: parsePositiveIntEnv(
      "ORCHESTRATION_JOB_TTL_SECONDS",
      604_800
    ),
    vaultIntentCreWorkflowId:
      process.env.VAULT_INTENT_CRE_WORKFLOW_ID?.trim() || undefined,
    creVaultWorkflowTriggerUrl:
      process.env.CRE_VAULT_WORKFLOW_TRIGGER_URL?.trim() || undefined,
    creVaultWorkflowTriggerToken:
      process.env.CRE_VAULT_WORKFLOW_TRIGGER_TOKEN?.trim() || undefined,
    creVaultWorkflowTriggerTimeoutMs: parsePositiveIntEnv(
      "CRE_VAULT_WORKFLOW_TRIGGER_TIMEOUT_MS",
      10_000
    ),
    vaultCreCallbackUrl: process.env.VAULT_CRE_CALLBACK_URL?.trim() || undefined,
    internalVaultJobCallbackSecret:
      process.env.INTERNAL_VAULT_JOB_CALLBACK_SECRET?.trim() || undefined,
    vaultProtocolSimulatedOwner:
      process.env.VAULT_PROTOCOL_SIMULATED_OWNER?.trim() || undefined,

    bufferMinimumTvlUsd: parseBufferMinimumTvlUsd(nodeEnv),
    bufferDrawdownWarningPct: parseBufferDrawdownWarningPct(),
    bufferRefillAssumedUsdPerHour: parseBufferPositiveFloat(
      "BUFFER_REFILL_ASSUMED_USD_PER_HOUR",
      10_000
    ),
    bufferDefaultStressDrawUsdPerHour: parseBufferPositiveFloat(
      "BUFFER_STRESS_DRAW_USD_PER_HOUR",
      5000
    ),
    bufferDefaultStressHorizonHours: parsePositiveIntEnv(
      "BUFFER_STRESS_HORIZON_HOURS",
      24
    ),
    bufferUsdPerUnitOverrides: parseBufferUsdPerUnitOverrides(),

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

    /** PoS / curated delegation (Phase 7) — see `.env.example`. */
    posDelegationExecutionMode: parsePosDelegationExecutionMode(),
    posDelegationEnabledChains: parsePosDelegationEnabledChains(),
    posDelegationRpcUrl:
      process.env.POS_DELEGATION_RPC_URL?.trim() ||
      "https://ethereum-sepolia.publicnode.com",
    posDelegationChainId: parsePositiveIntEnv("POS_DELEGATION_CHAIN_ID", 11_155_111),
    posDelegationRouterAddress:
      process.env.POS_DELEGATION_ROUTER_ADDRESS?.trim() || undefined,
    /** Prefer `POS_DELEGATION_*`; `DELEGATION_OPERATOR_PRIVATE_KEY` is a documented alias (Phase 7 plan). */
    posDelegationOperatorPrivateKey:
      process.env.POS_DELEGATION_OPERATOR_PRIVATE_KEY?.trim() ||
      process.env.DELEGATION_OPERATOR_PRIVATE_KEY?.trim() ||
      undefined,
  };
}

export type Config = ReturnType<typeof loadConfig>;
