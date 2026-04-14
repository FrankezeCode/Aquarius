# Phase 7a — Curated delegation router (EVM testnet)

Minimal contract: [`contracts/src/pos/CuratedDelegationRouter.sol`](../../contracts/src/pos/CuratedDelegationRouter.sol). It emits `DelegationRouted` when `recordDelegationIntent` is called — no custody, no beacon staking.

## Deploy (Sepolia example)

Prerequisites: Foundry or `solc`, funded Sepolia ETH on the deployer account. **Never commit private keys or `.env` with secrets.**

1. Compile (from repo root):

   ```bash
   pnpm compile:contracts
   ```

2. Deploy with your tool of choice, recording the contract address as `POS_DELEGATION_ROUTER_ADDRESS`.

3. Verify on the block explorer (Etherscan-class) using the same compiler version as the repo (`solc` 0.8.x per `package.json`).

## API wiring

Set (see root `.env.example`):

- `POS_DELEGATION_ENABLED_CHAINS=sepolia`
- `POS_DELEGATION_EXECUTION_MODE=testnet`
- `POS_DELEGATION_RPC_URL` — HTTPS RPC for the target network
- `POS_DELEGATION_CHAIN_ID=11155111` (Sepolia)
- `POS_DELEGATION_ROUTER_ADDRESS` — deployed router
- `POS_DELEGATION_OPERATOR_PRIVATE_KEY` — funded testnet EOA (server-side only)

Then `POST /api/v1/vault-gateway/intents` with `intentType: "pos.delegate"` should complete with a real `txHash` in the stored job result (`vaultTrace.txHashes`).

## Smoke script

Manual exit check:

```bash
pnpm delegate:testnet-smoke
```

Requires the same env vars as testnet mode (RPC, router, key).
