# Kamino risk — CRE workflow (stub)

Chainlink CRE workflow package for the **`kamino-solana`** bounded context. Layout matches [`workflows/aave-risk`](../aave-risk/) for CLI compatibility.

- **Workflow names:** `kamino-risk-staging`, `kamino-risk-production` (see `workflow.yaml`).
- **API ingestion:** HTTP callbacks use `workflowId` values `kamino-risk`, `kamino-risk-monitor`, or `kamino-risk-confidential-http` → [`apps/api/src/routes/internal/ingest/cre-webhook.ts`](../../apps/api/src/routes/internal/ingest/cre-webhook.ts).

This `main.ts` stub does not call Solana RPC; production orchestration typically triggers the Aquarius webhook with wallet/market payload or uses synthetic payloads for tests.

Simulate (when CRE CLI available):

```bash
cre -T staging-settings workflow simulate workflows/kamino-risk --non-interactive --trigger-index 0 --engine-logs
```
