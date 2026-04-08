# Per-chain vaults (`AquariusPerChainVault`)

Deploy **one contract per chain** (and per underlying asset if you use multiple assets on the same chain). Constructor encodes:

- `asset` — ERC-20 held by the vault on that network.
- `deploymentChainId` — must match the EVM `chainId` of the network you deploy to.
- `chainKey` — `keccak256("SHORT_LABEL")` for off-chain indexing.

## Suggested parameters (Aquarius scope)

| Network   | `deploymentChainId` | `chainKey` (Solidity)        |
|----------|----------------------|------------------------------|
| Ethereum | `1`                  | `keccak256("ETHEREUM")`      |
| Polygon  | `137`                | `keccak256("POLYGON")`       |
| Arbitrum | `42161`              | `keccak256("ARBITRUM")`      |
| 0G       | See current [0G docs](https://docs.0g.ai/) (testnet/mainnet) | `keccak256("OG_CHAIN")` |

Confirm **0G** `chainId` in official documentation before production deploy; it may differ between testnet (e.g. Galileo) and mainnet.

## Constructor

```text
constructor(IERC20 asset, uint256 deploymentChainId, bytes32 chainKey, address initialOwner)
```

## Notes

- Owner may `setPaused` to stop deposits and withdrawals.
- Staking and delegation are **not** implemented here; add audited strategy modules later.
