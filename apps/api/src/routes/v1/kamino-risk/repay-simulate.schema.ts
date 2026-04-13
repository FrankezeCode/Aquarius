import { z } from "zod";

const base58Pk = z
  .string()
  .trim()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address");

export const kaminoRepaySimulateBodySchema = z.object({
  wallet: base58Pk,
  market: base58Pk,
  repayMint: base58Pk,
  /** Human / UI amount string (passed to Klend `buildRepayTxns`). */
  amountUi: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^\d+(\.\d+)?$/, "amountUi must be a decimal string"),
  /** Optional idempotency key (client-generated); dedupes identical responses for ~10 minutes. */
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export type KaminoRepaySimulateBody = z.infer<typeof kaminoRepaySimulateBodySchema>;
