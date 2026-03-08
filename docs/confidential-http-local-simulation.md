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

## 3) CRE CLI simulation command (validated)

From repository root:

```bash
cre -T staging-settings workflow simulate workflows/aave-risk \
  --non-interactive \
  --trigger-index 0 \
  --engine-logs
```

This command was validated in this repository and produces engine logs plus
`Workflow Simulation Result` with `status: "completed"`.
Because this workflow uses a cron trigger (`trigger-index 0`), `--http-payload`
is not required for this simulation path.

## 4) Submission checklist (strict CLI-proof judges)

- Run `cre version` and keep output screenshot.
- Run the CLI simulation command above and keep success screenshot.
- Keep one screenshot that includes `--engine-logs` output.
- Add screenshots to:
  - `docs/submission/screenshots/cre-cli-sim-success.png`
  - `docs/submission/screenshots/cre-cli-sim-engine-logs.png`
- Keep CLI log artifact:
  - `artifacts/cre-cli-sim-output.txt`
