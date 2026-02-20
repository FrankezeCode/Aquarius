/**
 * Aave V3 — Mainnet Contract Addresses (Infrastructure Only)
 *
 * These addresses are for Ethereum mainnet Aave V3.
 * Tenderly forks inherit the same addresses since they fork mainnet state.
 */

export const AAVE_V3_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2" as const;
export const AAVE_V3_ORACLE = "0x54586bE62E3c3580375aE3723C145253060Ca0C2" as const;

export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as const;
export const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;
export const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7" as const;
export const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F" as const;
export const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" as const;

/**
 * Known Aave V3 whale addresses on Ethereum mainnet.
 * Used as default target addresses for position reads on forks.
 * These are publicly visible on-chain positions.
 */
export const DEFAULT_TARGET_ADDRESSES: readonly string[] = [
  "0x5aFE3855358E112B5647B952709E6165e1c1eEEe", // large Aave V3 user
  "0x28C6c06298d514Db089934071355E5743bf21d60", // Binance hot wallet (has Aave positions)
  "0xDef1C0ded9bec7F1a1670819833240f027b25EfF", // 0x exchange proxy
  "0x1111111254EEB25477B68fb85Ed929f73A960582", // 1inch router
  "0xBF72Da2Bd84c5170618Fbe5914B0ECA9638d5eb5", // known Aave power user
  "0x8EB8a3b98659Cce290402893d0123abb75E3ab28", // Avalanche bridge (has ETH positions)
  "0xF977814e90dA44bFA03b6295A0616a897441aceC", // Binance 8
  "0x6262998Ced04146fA42253a5C0AF90CA02dfd2A3", // known DeFi whale
  "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296", // known whale
  "0xD275E5cb559D7A578C1B23c75Cd2F84A8B6E8EA5", // Aave governance whale
];

/**
 * Aave uses 8 decimal precision for base currency amounts (USD).
 * Health factor uses 18 decimal precision (1e18 = 1.0).
 */
export const AAVE_BASE_CURRENCY_DECIMALS = 8;
export const AAVE_HF_DECIMALS = 18;
