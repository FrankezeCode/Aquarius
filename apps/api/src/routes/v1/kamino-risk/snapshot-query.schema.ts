import { z } from "zod";

/** Base58 Solana pubkey (conservative length band). */
const base58Pk = z
  .string()
  .trim()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address");

export const kaminoSnapshotQuerySchema = z.object({
  wallet: base58Pk,
  market: base58Pk.optional(),
  policy: z.string().trim().max(512).optional(),
});

export type KaminoSnapshotQuery = z.infer<typeof kaminoSnapshotQuerySchema>;
