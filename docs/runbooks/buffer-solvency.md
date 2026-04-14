# Runbook — Buffer solvency and agent readiness (internal)

**Audience:** Engineering and operations.  
**Not for end users.** Nothing in this document is a public SLA, customer promise, or marketing claim unless legal and product explicitly approve external reuse.

## What we measure

| Signal | Source | Notes |
|--------|--------|--------|
| **TVL (USD stub)** | Collateral rows × `BUFFER_USD_PER_UNIT_JSON` overrides on top of defaults | **Not** oracle pricing; replace with feeds/DB in production. |
| **Policy floor** | `BUFFER_MINIMUM_TVL_USD` | Shortfall = `max(0, floor − TVL)`. |
| **Drawdown** | vs previous successful poll in-process | Resets on process restart. |
| **Time-to-refill (proxy)** | `gapUsd / BUFFER_REFILL_ASSUMED_USD_PER_HOUR` | Modeled rate, not observed on-chain inflow. |
| **Stress solvent?** | Linear drain: `TVL − stressDrawUsdPerHour × horizonHours ≥ floor` | Simplified scenario; document assumptions when interpreting. |

## Internal API

- **`GET /api/internal/vault/buffer-health`** — full DTO (`disclosureKind: "internal"`, `notPublicSla: true`).
  - Query: `stressDrawUsdPerHour`, `horizonHours` (bounded); optional `suggestForRiskLevel=watch` to include **`INCREASE_BUFFER`** suggestion (aligned with [`risk-mitigation-strategy.ts`](../../apps/api/src/protocols/aave/vaults/domain/risk-mitigation-strategy.ts); **no execution**). Example: `/api/internal/vault/buffer-health?suggestForRiskLevel=watch`.
- **`GET /api/internal/metrics/domains`** — includes `domains["aave-buffer"]` summary for dashboards.

Rate limiting follows `/api/internal` defaults (see API config comments).

## Alert ideas (wire in your observability stack)

Poll `buffer-health` or scrape `metrics/domains` and alert when:

- `alertLevel === "critical"` (TVL below policy floor), or
- `alertLevel === "warning"` sustained for N consecutive polls, or
- `stress.solventAtHorizon === false` under default or configured stress parameters.

Do **not** log wallet-level strategies or secrets.

## Internal targets (defaults — tune per environment)

| Target | Default env | Purpose |
|--------|-------------|---------|
| Minimum TVL (USD) | `BUFFER_MINIMUM_TVL_USD` (0 in test, 10k otherwise) | Policy floor for `gapUsd` / critical alert. |
| Drawdown warning | `BUFFER_DRAWDOWN_WARNING_PCT` (5) | Warning when TVL drops vs prior poll by this % or more. |
| Refill model | `BUFFER_REFILL_ASSUMED_USD_PER_HOUR` (10000) | **Proxy** for hours-to-close-gap. |
| Default stress drain | `BUFFER_STRESS_DRAW_USD_PER_HOUR` / `BUFFER_STRESS_HORIZON_HOURS` | Projection defaults. |

These are **engineering guardrails**, not contractual obligations. Legal must review any customer-facing wording.

## Operational checklist

1. Confirm `BUFFER_MINIMUM_TVL_USD` matches current treasury policy for the deployment.
2. Replace stub USD map with oracle-backed notionals before relying on figures for real money decisions.
3. Reconcile in-memory vs persisted vault state: production should use a persistent `BufferVaultPort` implementation; metrics then reflect live positions.
