# 0G Chain integration — HackQuest / 0G APAC Track 5 proof

This document describes the **minimum viable on-chain integration** for HackQuest submissions that require:

- a **0G mainnet contract address**
- a **0G Explorer link** with verifiable activity
- proof that a **0G core component** is integrated (here: **0G Chain**, EVM)

Aquarius implements a minimal Solidity contract **`RiskCommitmentAnchor`** (`contracts/src/og/RiskCommitmentAnchor.sol`) that stores a `bytes32` commitment and a short context string on **0G Chain (EVM)**, plus a **TypeScript + viem** script to deploy and call it.

The script supports **both**:

| `OGF_NETWORK` | Chain | Chain ID | Default RPC | Explorer (tx / address) |
|---------------|-------|----------|---------------|-------------------------|
| `mainnet` (default) | 0G Mainnet | **16661** | `https://evmrpc.0g.ai` | `https://chainscan.0g.ai` |
| `testnet` (aliases: `galileo`, `dev`) | 0G Galileo Testnet | **16602** | `https://evmrpc-testnet.0g.ai` | `https://chainscan-galileo.0g.ai` |

Use **testnet** to practice with the [official faucet](https://faucet.0g.ai). Use **mainnet** for the **HackQuest Track 5** submission (they require a **mainnet** contract address and explorer proof).

> **Important:** This is **0G Chain (EVM)**, not 0G Storage or 0G Compute. Those are separate integrations; this path is the fastest to satisfy a “mainnet + explorer” rubric when you already ship TypeScript.

---

## Mainnet vs testnet (quick)

- **Practice / no cost:** set `OGF_NETWORK=testnet` in `.env`, fund via [faucet.0g.ai](https://faucet.0g.ai), then `pnpm 0g:chain:deploy:testnet` (from repo root) or `pnpm --filter api run 0g:chain:deploy:testnet`.
- **HackQuest proof:** set `OGF_NETWORK=mainnet`, fund deployer with real **0G** on chain **16661**, deploy again — **contract addresses differ per network**; use the **mainnet** `OGF_ANCHOR_CONTRACT_ADDRESS` in your submission.

`OGF_RPC_URL` overrides the default RPC for either network (e.g. QuickNode, Ankr — see [0G docs](https://docs.0g.ai/developer-hub/mainnet/mainnet-overview)).

---

## What you submit to HackQuest

| Requirement | What to paste |
|---|---|
| **0G mainnet contract address** | The `RiskCommitmentAnchor` address printed after `deploy` (also set as `OGF_ANCHOR_CONTRACT_ADDRESS`). |
| **0G Explorer link** | `https://chainscan.0g.ai/tx/<DEPLOY_TX_HASH>` for deployment, and optionally `https://chainscan.0g.ai/tx/<ANCHOR_TX_HASH>` after you call `anchor`. |
| **Which 0G component** | **0G Chain** — EVM smart contract deployed and called on 0G mainnet. |
| **Repo proof** | This file + `contracts/src/og/RiskCommitmentAnchor.sol` + `apps/api/scripts/0g-chain-anchor.ts` + compiled artifact `RiskCommitmentAnchor` in `apps/api/src/infrastructure/contracts/artifacts.ts`. |

If HackQuest insists the explorer URL must be on `explorer.0g.ai` instead of `chainscan.0g.ai`, use the alternate official explorer from current 0G docs (same tx hash).

---

## Network parameters (verify against current 0G docs)

| Network | Chain ID | Default RPC | Block explorer |
|---------|----------|-------------|----------------|
| **Mainnet** | `16661` | `https://evmrpc.0g.ai` | `https://chainscan.0g.ai` |
| **Testnet (Galileo)** | `16602` | `https://evmrpc-testnet.0g.ai` | `https://chainscan-galileo.0g.ai` |

- [Mainnet overview](https://docs.0g.ai/developer-hub/mainnet/mainnet-overview)
- [Testnet overview](https://docs.0g.ai/developer-hub/testnet/testnet-overview)

Override RPC with **`OGF_RPC_URL`** if you use a third-party provider.

---

## Prerequisites

1. **Gas tokens (native 0G)** on the network you selected:
   - **Mainnet:** purchase / bridge per [How to get 0G](https://docs.0g.ai/introduction/how-to-get-0g).
   - **Testnet:** [faucet.0g.ai](https://faucet.0g.ai) (and/or [Google Cloud faucet](https://cloud.google.com/application/web3/faucet/0g/galileo)) — small daily limit; enough for deploy + a few `anchor` calls.

2. **A dedicated deployer private key** in `.env` as **`OGF_ANCHOR_PRIVATE_KEY`** (`0x` + 64 hex chars).  
   **Never commit** this key. Use a throwaway hot wallet.

3. **`OGF_NETWORK`** — `mainnet` (default) or `testnet` for Galileo.  
   **Important:** `OGF_ANCHOR_CONTRACT_ADDRESS` is **per-network** — if you deploy on testnet first, you must deploy again on mainnet for HackQuest and update the env to the **mainnet** address.

4. **Recompile contracts** after pulling this repo:

   ```bash
   pnpm compile:contracts
   ```

---

## Step 1 — Deploy on testnet (recommended first)

Set in `.env`:

```bash
OGF_NETWORK=testnet
OGF_ANCHOR_PRIVATE_KEY=0x…
# OGF_ANCHOR_CONTRACT_ADDRESS=   # leave unset until deploy prints it
```

From **repository root**:

```bash
pnpm 0g:chain:deploy:testnet
```

Or:

```bash
pnpm --filter api run 0g:chain:deploy:testnet
```

Copy printed `OGF_ANCHOR_CONTRACT_ADDRESS` into `.env` (still with `OGF_NETWORK=testnet`).

---

## Step 1b — Deploy on mainnet (HackQuest proof)

Set:

```bash
OGF_NETWORK=mainnet
OGF_ANCHOR_PRIVATE_KEY=0x…   # funded with mainnet 0G for gas
```

Then:

```bash
pnpm 0g:chain:deploy:mainnet
```

Or default (mainnet is default if `OGF_NETWORK` is unset):

```bash
pnpm 0g:chain:deploy
```

---

## Step 2 — Anchor a commitment (verifiable second tx)

Aquarius already computes **SHA-256 commitments** over canonical JSON in the ZG pipeline (`POST /api/v1/zg/pipeline`). The `commitment` field in the JSON response is a **`0x` + 64 hex character** string — valid input for `anchor`.

**2a.** Start the API with `ZG_PIPELINE_MODE=mock` (or `live`), then:

```bash
curl -s -X POST "http://localhost:3001/api/v1/zg/pipeline" \
  -H "Content-Type: application/json" \
  -d '{"protocol":"kamino","chain":"solana","contextRef":"hackquest-demo"}'
```

Copy the `commitment` value from the response.

**2b.** Anchor on the **same** network as in `.env` (`OGF_NETWORK`):

```bash
pnpm --filter api exec tsx --env-file=../../.env scripts/0g-chain-anchor.ts anchor <PASTE_COMMITMENT_0x...> "hackquest-demo"
```

You get an explorer URL on **Galileo ChainScan** or **mainnet ChainScan** depending on `OGF_NETWORK`.

---

## Step 3 — (Optional) Link the story in your HackQuest write-up

One sentence:

> Aquarius computes deterministic risk commitments off-chain (`POST /api/v1/zg/pipeline`), then anchors those commitments on **0G Chain** via our `RiskCommitmentAnchor` contract using the bundled **viem** script — verifiable on **0G ChainScan**.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `insufficient funds` | Deployer has no native 0G for gas on the **selected** network (`16661` mainnet or `16602` testnet). Use [faucet.0g.ai](https://faucet.0g.ai) on testnet. |
| `replacement transaction underpriced` / nonce errors | Stuck prior tx — reset nonce or wait for confirmation. |
| Script cannot find artifact | Run `pnpm compile:contracts` from repo root. |
| Wrong network / wrong contract | `OGF_NETWORK`, RPC, and `OGF_ANCHOR_CONTRACT_ADDRESS` must all match (testnet address ≠ mainnet). |

---

## Security

- **`OGF_ANCHOR_PRIVATE_KEY`** is a **secret** — environment variable only, never logged, never committed.
- The anchor contract uses **`msg.sender == owner`** so random addresses cannot overwrite your demo state; use `transferOwnership` on-chain if you need to rotate.

---

## Contract ABI (reference)

The canonical ABI and bytecode are generated into:

- `contracts/compiled/artifacts.ts`
- `apps/api/src/infrastructure/contracts/artifacts.ts`

Field `ContractArtifacts.RiskCommitmentAnchor`.
