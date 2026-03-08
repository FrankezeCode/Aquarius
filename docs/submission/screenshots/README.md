# Submission Screenshot Slots

Place your final CRE CLI proof screenshots in this folder before submission:

- `cre-cli-sim-success.png`  
  Screenshot showing a successful `cre workflow simulate ...` completion.

- `cre-cli-sim-engine-logs.png`  
  Screenshot showing simulation engine logs and trigger execution details.

Recommended capture details:

1. Include the full command line used.
2. Include visible success markers and timestamp.
3. Keep target and workflow path visible in the screenshot.

Suggested command for the screenshot:

```bash
cre -T staging-settings workflow simulate workflows/aave-risk \
  --non-interactive \
  --trigger-index 0 \
  --engine-logs
```
