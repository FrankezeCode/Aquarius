# Kamino / Solana — hardening checklist (Phase 6)

Use this before widening the write surface or going to production with Solana transactions.

## Secrets & keys

- [ ] No private keys or wallet secrets in API process env beyond what your deployment model allows.
- [ ] RPC URLs from env only; never log full URLs if they contain embedded keys.

## Write / simulation path

- [ ] `KAMINO_WRITE_ENABLED` off by default in non-prod; explicit enable in prod.
- [ ] Mint allowlist (`KAMINO_ALLOWED_REPAY_MINTS`) and amount caps (`KAMINO_MAX_REPAY_UI`) reviewed for mainnet.
- [ ] All public write-adjacent routes rate-limited (`RATE_LIMIT_KAMINO_WRITE_MAX`).
- [ ] Idempotency keys used by clients for simulate retries.

## Transactions

- [ ] Prefer **simulation** before any future signed send; instruction surfaces reviewed for account list tampering.
- [ ] Versioned transactions / LUT behavior validated on devnet before mainnet.

## Observability

- [ ] `/api/internal/metrics/domains` monitored for `kamino-solana` RPC error rate and latency.
- [ ] CRE responses: `snapshotFreshness` understood when `live: false` (stale fallback).

## Tests

- [ ] CI runs `pnpm lint` (API boundary script) and Kamino integration tests.
- [ ] Load: optional external k6/autocannon against health + snapshot (with test RPC).
