# Phase 7b — Own validators on one chain (pilot) — operations

This runbook describes **operational** expectations for running proprietary validators. It is **not** implemented as automation in this repository (no Ansible/k8s in Phase 7 scope).

## Goals

- Key material for validator identities lives in **KMS/HSM** or equivalent; **never** in git or application env files intended for CI.
- Clear separation: **curated partner delegation** (Phase 7a API rail) vs **direct validator operation** (this document).

## Key ceremony (outline)

1. Generate withdrawal and validator keys using the chain’s official tooling (Ethereum: `staking-deposit-cli` or protocol-specific flows).
2. Store signing keys in HSM/KMS; restrict access with IAM and break-glass procedures.
3. Document custodians and rotation policy; no single human export of raw private keys for production.

## Monitoring checklist

- Missed attestations / downtime alerts
- Slashing and balance reports
- Client version and fork compatibility
- RPC / MEV relay health if applicable

## Non-goals (explicit)

- Storing validator private keys in the Aquarius API process environment.
- Automating key generation or withdrawal in CI.
- Treating Phase 7a `CuratedDelegationRouter` as beacon chain staking — it is a **wiring and intent trace** surface for testnet only.

## References

- Phase 7a deploy notes: [`phase7-delegation-router.md`](./phase7-delegation-router.md)
- Product context: [`../vault-strategy.md`](../vault-strategy.md)
