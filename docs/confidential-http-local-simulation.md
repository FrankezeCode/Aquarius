# Confidential HTTP Local DON Simulation

This runbook validates Aquarius confidential flow without CRE production deployment.

Claim scope:

`End-to-end Confidential HTTP validated in local CRE DON simulation`

## 1) Run local simulation validation

From repository root:

```bash
pnpm run:local-cre-don-sim
```

This executes the live Aquarius action-layer path and verifies:

- confidential dispatch is received
- callback returns `ingestionMode: "confidential-http"`
- correlation ID is propagated end-to-end

## 2) Expected proof artifacts

Generated files:

- `artifacts/confidential-http-validation.json`
- `artifacts/local-cre-don-simulation-proof.json`

Both artifacts contain:

- `validationMode = "local_cre_don_simulation"`
- `claim` text for submission safety
- callback status/result with correlation ID

## 3) Optional CRE CLI simulation command

If running from a full CRE SDK project structure:

```bash
cre workflow simulate workflows/aave-risk \
  --non-interactive \
  --trigger-index 0 \
  --http-payload @./workflows/aave-risk/payload.local-simulation.json \
  --target staging-settings \
  --engine-logs
```

Use this to demonstrate payload compatibility with the same Aquarius contract.
