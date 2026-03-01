export const AAVE_ACTIVE_CHAINS = ["ethereum", "polygon"] as const;

export type AaveActiveChain = (typeof AAVE_ACTIVE_CHAINS)[number];

export function isAaveActiveChain(input: string | undefined): input is AaveActiveChain {
  if (!input) return false;
  return (AAVE_ACTIVE_CHAINS as readonly string[]).includes(input.toLowerCase());
}

export function resolveAaveActiveChain(input: string | undefined): AaveActiveChain {
  const normalized = input?.toLowerCase();
  return isAaveActiveChain(normalized) ? normalized : "ethereum";
}

