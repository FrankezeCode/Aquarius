# README Phase 1 — Full inventory (reorg checklist)

**Goal:** Nothing important is dropped when `README.md` is reorganized. This document is the **exit artifact** for Phase 1: line-tagged blocks, cross-reads with [`vault-strategy.md`](vault-strategy.md) / ADRs, judge-facing code anchors, and honest **roadmap vs shipped** notes for validators/delegation.

**Source file:** [`README.md`](../README.md) (line numbers as of inventory date).

---

## 1. README.md — block inventory (line ranges and tags)

| Lines (approx.) | Tag(s) | Section / content |
|-----------------|--------|-------------------|
| 1–31 | `hero` | Title, tagline, dedication, intro video, badges (YouTube / Vercel / Gitbook) |
| 33–59 | `judge`, `vault`, `integrations` | **Judge reading order** — timeboxes, integration rails table, vault/security summary |
| 61–138 | `toc` | **Table of Contents** (nested) |
| 140–146 | `overview` | **Overview** — API-first risk intelligence, ADR 0001 pointer |
| 148–159 | `overview`, `aave` | **Aquarius** — bullet list of capabilities (CRE, CCC, CCIP, copilot, SDK) |
| 161–169 | `overview`, `chainlink` | **What Problem Aquarius Solves** — DeFi user + Chainlink ecosystem problem |
| 171–181 | `overview` | **How It Works** — numbered steps |
| 183–197 | `diagrams` | **Quick System Flow** — mermaid |
| 199–358 | `diagrams`, `vault`, `aave`, `zg` | **Architecture Diagram** — full-stack mermaid + **Full stack API and domain (current)** + **Vault, staking, and yield (roadmap)** |
| 360–400 | `aave`, `contracts` | **Contracts and Architecture** — core contracts, API/orchestration, intelligence, execution, SDK |
| 402–406 | `overview` | **System Actors** |
| 408–455 | `zg` | **Zero Gravity (0G) and ZG pipeline** — subsections chain/routing through config |
| 457–499 | `chainlink`, `cre`, `ccc`, `ccip`, `confidential` | **Chainlink Integrations** — CRE, CCC, Confidential HTTP, CCIP |
| 501–651 | `chainlink`, `workflow`, `confidential` | **Workflow Flows** — E2E, monitoring, escalation, mitigation, copilot, confidential flows, non-custodial promise essay |
| 653–670 | `aave`, `sdk` | **Health Score, SELVA SDK, and Bot APIs** — EVM-facing product APIs |
| 672–703 | `ops` | **Deploying**, **Commands** |
| 705–749 | `testing`, `chainlink` | **Testing** — includes `local_don_ccc` semantics |
| 751–799 | `validation` | **Validation Report (End-to-End Proof)** — summary, stages, Tenderly links |
| 801–824 | `validation`, `confidential` | **Confidential HTTP Local Simulation Proof** |
| 826–901 | `validation`, `chainlink` | **CRE Requirement Compliance Checklist** — submission proof pack |
| 903–940 | `chainlink` | **Chainlink Usage (Direct Code Links)** |
| 942–947 | `production` | **Known Issues and Limitations** |
| 949–991 | `production`, `security` | **Production considerations** — hardening, security/API surface, scaling, ops, CRE readiness, compliance |
| 993–999 | `roadmap` | **Future Developments** |
| 1001–1020 | `closing` | **Challenges We Ran Into** |
| 1022–1033 | `closing`, `frontend` | **Frontend** |
| 1035–1092 | `closing` | **Builder’s Note** |
| 1094–1115 | `closing` | **Gratitude & Acknowledgments** |
| 1117–1139 | `closing` | **Dedication** |
| 1142–1163 | `closing` | **Fun Fact** / **Meaning of Names** (H1 `# Fun Fact` + `## Meaning of Names...`) |

**Tag legend:** `hero`, `toc`, `judge`, `overview`, `diagrams`, `chainlink`, `cre`, `ccc`, `ccip`, `confidential`, `aave`, `vault`, `zg`, `workflow`, `sdk`, `validation`, `testing`, `ops`, `production`, `security`, `roadmap`, `closing`, `frontend`.

**Gap vs README-only narrative:** **Kamino / Solana** is not a top-level `##` section; it appears indirectly via API layer bullets, **Judge reading order** table, and code paths. **Vault-gateway** is embedded in architecture diagram and ZG section prose, not a standalone `## Vault gateway` chapter.

---

## 2. Cross-read: [`docs/vault-strategy.md`](vault-strategy.md)

| Theme in vault-strategy | README coverage today | Action for later reorg |
|-------------------------|------------------------|-------------------------|
| PoS / network participation (roadmap vs live) | **Judge** summary + **Vault, staking, and yield (roadmap)** | **Keep** honesty; **tighten** duplication between Judge block and §Vault subsection |
| Buffer vs yield sleeves; advisory routing | Architecture + ZG **on-chain vault**; vault-strategy is canonical | **Merge** one short “sleeves” paragraph into Aquarius-centric chapter or keep pointer |
| GET advisory vs POST execution | **Judge** table; vault-strategy §2 tables | **Keep** vault-strategy as authoritative; README **links** + short summary only |
| `pos.delegate` / Phase 7 | vault-strategy §2.3 table | README **does not** yet foreground Phase 7 in main narrative — optional **tighten** in Integrations chapter |
| ADR 0003 gates | README Overview links ADR 0001; vault-strategy links **ADR 0003** | **Merge** explicit ADR 0003 pointer near vault-gateway / orchestration prose |

---

## 3. Cross-read: [`docs/adr/0003-phase0-orchestration-and-execution.md`](adr/0003-phase0-orchestration-and-execution.md)

| ADR topic | Maps to README region |
|-----------|------------------------|
| Single **OrchestrationPort** entry | **Contracts and Architecture** → API and Orchestration Layer; architecture mermaid |
| No keys in Fastify; custody model | **Production** → Security; confidential / Builder sections |
| `VAULT_GATEWAY_EXECUTION_ENABLED`, mock/live modes | **Production**, **Testing**, vault-strategy (README should cross-link in reorg) |
| North-star vs shipped (comms) | **Judge** vault summary; **Future Developments** |

---

## 4. Judge-facing code anchors (paths to cite in README)

| Topic | Primary path(s) |
|-------|-----------------|
| Orchestration port | [`apps/api/src/application/ports/orchestration.port.ts`](../apps/api/src/application/ports/orchestration.port.ts) |
| CRE orchestration adapter | [`apps/api/src/infrastructure/orchestration/cre-orchestration.adapter.ts`](../apps/api/src/infrastructure/orchestration/cre-orchestration.adapter.ts) |
| Vault-gateway routes (GET manifest/routing) | [`apps/api/src/routes/v1/vault-gateway/routes.ts`](../apps/api/src/routes/v1/vault-gateway/routes.ts) |
| Vault-gateway POST intents | [`apps/api/src/routes/v1/vault-gateway/post-intents.ts`](../apps/api/src/routes/v1/vault-gateway/post-intents.ts) |
| Intent Zod schema | [`apps/api/src/services/vault-gateway/intent.schema.ts`](../apps/api/src/services/vault-gateway/intent.schema.ts) |
| Kamino risk API | [`apps/api/src/routes/v1/kamino-risk/index.ts`](../apps/api/src/routes/v1/kamino-risk/index.ts) |
| ZG pipeline route | [`apps/api/src/routes/v1/zg/`](../apps/api/src/routes/v1/zg/) (e.g. `pipeline.ts`) |
| PoS / curated delegation adapter | [`apps/api/src/protocols/pos/partner-delegation.adapter.ts`](../apps/api/src/protocols/pos/partner-delegation.adapter.ts) |
| Phase 8 public API surface (advisory vs execution) | [`docs/api/public-surface.md`](api/public-surface.md) |
| Global error handler (Phase 8) | [`apps/api/src/http/register-public-error-handler.ts`](../apps/api/src/http/register-public-error-handler.ts) |

---

## 5. Honesty: validator / delegation / buffer — roadmap vs shipped

| Topic | Roadmap (documented intent) | Shipped / staged in repo (do not overclaim in README) |
|-------|----------------------------|--------------------------------------------------------|
| Own validators, broad PoS “skin in the game” | [vault-strategy §1.1](vault-strategy.md#11-network-participation-pos), [runbook phase7b](runbooks/phase7b-validator-pilot.md) | **Not** live as operator-run validators in product; ops runbook only |
| Native delegation / LST as retail product | Narrative in vault-strategy | **Roadmap**; vault is deposit/withdraw shell + strategy adapters planned |
| **Curated delegation** `pos.delegate` | Phase 7 plan | **Implemented** — testnet/mock via `PartnerDelegationRouter` + env; see [phase7-delegation-router](runbooks/phase7-delegation-router.md) |
| Buffer solvency automation on mainnet | vault-strategy §1.3 | Internal metrics / runbooks; **full closed-loop** per vault-strategy is roadmap unless separately shipped |
| Advisory GET vault-gateway | vault-strategy §2 | **Live** — manifest, routing |
| POST vault intents | ADR 0003, vault-strategy | **Live** behind `VAULT_GATEWAY_EXECUTION_ENABLED` + auth |

Use **Live** vs **Roadmap** labels in any README rewrite to match [ADR 0003 §4](adr/0003-phase0-orchestration-and-execution.md) and vault-strategy.

---

## 6. Migration matrix — source → proposed TOC bucket → action

*Proposed buckets are for a future Aquarius-centric README TOC (Phase 2+); they do not change files yet.*

| Current README section(s) | Proposed TOC bucket | Action |
|---------------------------|---------------------|--------|
| Hero (lines 1–31) | `Aquarius Protocol — Hero` | **Keep**; optionally **tighten** subtitle for multi-chain (not Chainlink-only phrasing) |
| Judge reading order | `For judges — Reading order` | **Keep** |
| Table of Contents | `TOC` | **Rebuild** when structure changes; **merge** nested judge sub-anchors |
| Overview, Aquarius, What Problem, How It Works | `Core narrative` | **Keep**; **tighten** problem statement to mention OG/Kamino/Solana equally where true |
| Quick System Flow, Architecture Diagram + subs | `Architecture` | **Keep** diagrams; **merge** Kamino/ZG/vault into one **Integration topology** figure in a later phase |
| Contracts and Architecture | `Monorepo map — Contracts & layers` | **Keep**; **add** explicit Kamino/pos folder bullets if missing |
| System Actors | `Architecture` or `Core narrative` | **Keep** (short) |
| Zero Gravity (0G) and ZG pipeline | `Integrations — 0G / OG / ZG` | **Keep**; **tighten** duplication with architecture diagram |
| Chainlink Integrations | `Integrations — Chainlink` | **Keep**; central rail for judges |
| Workflow Flows | `Workflows` or split under Chainlink + CRE | **Tighten** length or **merge** confidential essay under single subsection |
| Health Score, SELVA SDK | `Integrations — EVM / Aave intelligence` | **Keep**; add cross-link to Kamino row in judge table |
| Deploying, Commands, Testing | `Operations & developer` | **Keep** |
| Validation Report + Confidential proof + CRE checklist | `Validation & evidence` | **Keep**; consider **merge** into one parent `## Validation` with children |
| Chainlink Usage (direct links) | `Integrations — Chainlink` (appendix) or `Reference` | **Keep** or **merge** into Chainlink chapter |
| Known Issues, Production, Future | `Production, roadmap, honesty` | **Keep** |
| Challenges, Frontend, Builder, Gratitude, Dedication, Fun Fact, Names | `Closing` | **Retain** per product decision — **no drop** |

---

## 7. Exit checklist (Phase 1 complete)

- [x] README walked and blocks tagged (§1).
- [x] `docs/vault-strategy.md` cross-read and mapped (§2).
- [x] ADR 0003 cross-read and mapped (§3).
- [x] Judge code anchor list (§4).
- [x] Validator/delegation/buffer honesty table (§5).
- [x] Source → TOC bucket → keep|tighten|merge matrix (§6).

**Next step (Phase 2+):** Apply §6 matrix to edit [`README.md`](../README.md) — out of scope for this Phase 1 deliverable.
