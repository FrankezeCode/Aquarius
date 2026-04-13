# Roadmap — Kamino / Solana program sequencing

Implementation status for the bounded context **`kamino-solana`** (see [ADR 0001](adr/0001-domains-and-boundaries.md), [ADR 0002](adr/0002-kamino-solana-bounded-context.md)).

| # | Phase | Scope | Status |
|---|--------|--------|--------|
| 1 | **ADR + boundaries** | `AquariusDomainId`, shared kernel, no Kamino↔Aave coupling | Done — ADR 0001 + 0002; `apps/api/scripts/check-domain-boundaries.mjs` |
| 2 | **Registry + routes + ports + stubs** | Web protocol registry, API `/api/v1/kamino-risk/*`, `KaminoMarketReader` port, stub reader, CRE workflow package | Done — see `apps/web`, `apps/api`, `workflows/kamino-risk/` |
| 3 | **Read path + intelligence + copilot** | Live snapshot (`kamino-snapshot.service`), scorer, copilot context | Done |
| 4 | **CRE wiring** | `kamino-risk*` webhooks, escalation + `KaminoMitigationIntent`, synthetic + local_don paths | Done — `cre-webhook.ts` |
| 5 | **Mitigation / write path** | Repay tx builder, policy, simulate-only dry-run, idempotency | Done — `POST .../repay/simulate` |
| 6 | **Harden** | Tests, metrics, stale/cache discipline, security review checklist | Done — see [kamino-solana hardening](security/kamino-solana-hardening.md), integration tests |

**Load testing** is not automated in-repo; run your own k6/autocannon against `/api/v1/kamino-risk/health` and internal metrics as needed.
