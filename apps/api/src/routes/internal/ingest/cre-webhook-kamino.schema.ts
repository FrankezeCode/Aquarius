/**
 * Zod schemas for Kamino payloads embedded in CRE webhook `data`.
 */

import { z } from "zod";

const base58Pk = z
  .string()
  .trim()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);

export const kaminoRiskMetadataSchema = z.object({
  protocol: z.literal("kamino"),
  chainId: z.literal(0),
  timestamp: z.number(),
  solanaCluster: z.enum(["mainnet-beta", "devnet", "testnet"]),
});

export const kaminoRiskSnapshotSchema = z.object({
  metadata: kaminoRiskMetadataSchema,
  wallet: base58Pk,
  marketPubkey: base58Pk,
  loanToValuePct: z.number(),
  reserveLabels: z.array(z.string()),
  riskScore: z.number(),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export const kaminoIntelligenceV1Schema = z.object({
  domain: z.literal("kamino-solana"),
  stage: z.enum(["info", "confirm", "invalidate"]),
  composite01: z.number(),
  headline: z.string(),
  summary: z.string(),
  events: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      message: z.string(),
      severity: z.enum(["info", "warning", "critical"]),
    })
  ),
});

/** Synthetic path: pre-built snapshot + intelligence (no Solana RPC). */
export const kaminoSyntheticPayloadSchema = z.object({
  synthetic: z.literal(true),
  snapshot: kaminoRiskSnapshotSchema,
  intelligence: kaminoIntelligenceV1Schema,
});

export type KaminoSyntheticPayload = z.infer<typeof kaminoSyntheticPayloadSchema>;

export function parseKaminoSyntheticPayload(data: Record<string, unknown>) {
  return kaminoSyntheticPayloadSchema.safeParse(data);
}
