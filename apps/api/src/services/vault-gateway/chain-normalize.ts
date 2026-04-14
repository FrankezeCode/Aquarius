/**
 * Shared chain/asset normalization for advisory routing and execution intent mapping.
 */

const OG_ALIASES = new Set(["0g", "og", "galileo", "og_chain", "zerog"]);

export function normalizeVaultChain(raw: string): string {
  const c = raw.trim().toLowerCase();
  if (OG_ALIASES.has(c)) return "og_chain";
  return c;
}

export function normalizeVaultAsset(raw: string): string {
  return raw.trim().toUpperCase();
}
