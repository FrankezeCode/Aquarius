import { z } from "zod";

const correlationIdSchema = z.string().trim().min(8).max(128).optional();

const evmAddressHex = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "validatorAddress must be a 20-byte hex string (0x + 40 hex chars)");

const chainAssetAmount = {
  chain: z.string().trim().min(1).max(64),
  asset: z.string().trim().min(1).max(32),
  amount: z.string().trim().min(1).max(64),
  idempotencyKey: z.string().trim().min(1).max(128),
  correlationId: correlationIdSchema,
};

/** Intent types accepted by the vault-gateway POST rail (extend as product adds rails). */
export const vaultIntentBodySchema = z.discriminatedUnion("intentType", [
  z.object({
    intentType: z.literal("cre.workflow"),
    ...chainAssetAmount,
  }),
  z.object({
    intentType: z.literal("aave.buffer.top_up"),
    ...chainAssetAmount,
  }),
  z.object({
    intentType: z.literal("aave.vault.protect"),
    ...chainAssetAmount,
    aqAssetId: z.string().trim().min(1).max(256),
    riskLevel: z.enum(["safe", "watch", "early-warning", "critical"]),
  }),
  z.object({
    intentType: z.literal("pos.delegate"),
    ...chainAssetAmount,
    validatorAddress: evmAddressHex,
    partnerId: z.string().trim().max(64).optional(),
    memo: z.string().trim().max(256).optional(),
  }),
]);

export type VaultIntentBody = z.infer<typeof vaultIntentBodySchema>;

export function parseVaultIntentBody(raw: unknown): VaultIntentBody {
  return vaultIntentBodySchema.parse(raw);
}
