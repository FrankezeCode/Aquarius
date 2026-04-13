# Aquarius DeFi Lab — Architecture

## Ownership & Principles

Agents and contributors must treat the following as non‑negotiable:

- **APIs are the product.** The Aquarius API is the primary surface. External developers, bots, and internal services consume it.
- **UI is a consumer.** The web app (Next.js) consumes the API. It is not the source of truth. No protocol or business logic in the UI.
- **Protocol logic is isolated.** All protocol-specific logic lives in adapters, indexers, and API route handlers. Shared types live in `packages/types`. No protocol logic in `apps/web`.
- **Security assumptions are strict.** See `.cursor/rules/security.mdc`. Validate all inputs (Zod). No secrets in code. Rate‑limit public APIs.
- **Real-time systems are first-class.** Streams (mempool, liquidations, price shocks) and event-driven pipelines are core. Prefer subscriptions over polling where applicable.

### Domains & boundaries

Aquarius uses **bounded domains** (e.g. EVM/Aave vs Solana/Kamino) with a **minimal shared kernel**. **CRE and workflow orchestration** stay **domain-neutral** at the spine; **intelligence** (scoring, monitoring, copilot context) stays **domain-specific** and is routed explicitly—no mixed-protocol copilot without a router. CRE consumes **domain-tagged payloads** at the application edge; protocol SDK types do not leak into CRE core. Canonical IDs (`aave-evm`, `kamino-solana`), legacy `ProtocolId` mapping rules, and TypeScript contracts live in **[ADR 0001: Domains and boundaries](adr/0001-domains-and-boundaries.md)**.

## Structure

- `apps/web` — Next.js 16 frontend (marketing, dashboard, API docs UI).
- `apps/api` — Aquarius API (Fastify). Public routes under `/api/v1/*` (e.g. `/api/v1/aave-risk`, `/api/v1/kamino-risk` for the Kamino/Solana bounded context). Internal under `/api/internal/*`.
- `services/` — Indexers, event-engine, prediction-engine, scheduler. Heavy backend intelligence.
- `packages/` — Shared SDK (`sdk-js`), types, utils. No business logic in packages.
- `infra/` — Docker, Terraform, Kubernetes, monitoring. Placeholder structure only.
- `docs/` — API docs, architecture, protocols, roadmap.
- `docs/adr/` — Architecture Decision Records (domain boundaries, future ADRs).

## References

- `.cursor/rules/` — Next.js, API, protocols, realtime, security, UI.
- `.cursor/skills/aquarius-system/SKILL.md` — System-level guidance.
- `docs/adr/0001-domains-and-boundaries.md` — Domains, CRE vs intelligence boundaries, shared kernel.
