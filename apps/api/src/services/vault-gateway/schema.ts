import { z } from "zod";

export const vaultRoutingQuerySchema = z.object({
  chain: z.string().trim().min(1).max(64),
  asset: z.string().trim().min(1).max(32),
});

export type VaultRoutingQuery = z.infer<typeof vaultRoutingQuerySchema>;

export function parseVaultRoutingQuery(
  query: Record<string, string | string[] | undefined>
): { success: true; data: VaultRoutingQuery } | { success: false; message: string } {
  const chain =
    typeof query.chain === "string"
      ? query.chain
      : Array.isArray(query.chain)
        ? query.chain[0]
        : "";
  const asset =
    typeof query.asset === "string"
      ? query.asset
      : Array.isArray(query.asset)
        ? query.asset[0]
        : "";

  const parsed = vaultRoutingQuerySchema.safeParse({ chain, asset });
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }
  return { success: true, data: parsed.data };
}
