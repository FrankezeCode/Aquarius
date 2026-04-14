# Kamino — bounded context (stub)

Solana / Kamino lending integration is **not** wired to the vault-gateway execution rail in this phase.

- **Aave** vault intents use [`AaveVaultAdapter`](../aave/vaults/infrastructure/aave-vault.adapter.ts) behind `VaultIntentExecutor`.
- **Kamino** will add an analogous adapter implementing the same application port when Klend execution is integrated.

Do not import Kamino SDK from vault-gateway routes; use `OrchestrationPort` only.
