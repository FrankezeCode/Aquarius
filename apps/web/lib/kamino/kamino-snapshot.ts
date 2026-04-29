/**
 * Kamino risk snapshot types, validation, demo data, and UI derivations (web).
 */

import { z } from "zod";

/** Matches `GET /api/v1/kamino-risk/snapshot` success shape. */
export const kaminoSnapshotResponseSchema = z.object({
  snapshot: z
    .object({
      metadata: z.object({
        protocol: z.literal("kamino"),
        chainId: z.literal(0),
        timestamp: z.number(),
        solanaCluster: z
          .enum(["mainnet-beta", "devnet", "testnet"])
          .optional(),
      }),
      wallet: z.string(),
      marketPubkey: z.string(),
      loanToValuePct: z.number(),
      reserveLabels: z.array(z.string()),
      riskScore: z.number(),
      severity: z.enum(["low", "medium", "high", "critical"]),
    })
    .passthrough(),
  intelligence: z
    .object({
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
        }),
      ),
    })
    .passthrough(),
  copilot: z
    .object({
      promptBlock: z.string(),
    })
    .passthrough(),
  latencyMs: z.number(),
});

export type KaminoSnapshotResponse = z.infer<typeof kaminoSnapshotResponseSchema>;

export type KaminoHealthBreakdown = {
  liquidity: number;
  riskConcentration: number;
  liquidationRisk: number;
  smartContractRisk: number;
};

function clampScore(n: number): number {
  return Math.min(99, Math.max(18, Math.round(n)));
}

/**
 * Derives the four Aave-style breakdown bars (0–100) from Kamino snapshot fields.
 * Heuristic until the API exposes explicit dimensions.
 */
export function deriveHealthBreakdownFromSnapshot(
  snapshot: KaminoSnapshotResponse["snapshot"],
): KaminoHealthBreakdown {
  const { loanToValuePct, riskScore, reserveLabels, severity } = snapshot;
  const sevN =
    severity === "critical" ? 4
    : severity === "high" ? 3
    : severity === "medium" ? 2
    : 1;
  const diversify = Math.min(reserveLabels.length * 4, 24);
  const ltv = Math.min(100, Math.max(0, loanToValuePct));

  const liquidity = clampScore(
    riskScore * 0.85 + (100 - ltv) * 0.12 + diversify * 0.35 - sevN * 2,
  );
  const riskConcentration = clampScore(
    riskScore * 0.92 + 8 - diversify * 0.4 + sevN * 1.5,
  );
  const liquidationRisk = clampScore(
    riskScore * 0.88 - ltv * 0.22 + 14 - sevN * 3,
  );
  const smartContractRisk = clampScore(68 - sevN * 4 + (diversify > 12 ? 4 : -6));

  return {
    liquidity,
    riskConcentration,
    liquidationRisk,
    smartContractRisk,
  };
}

/** Aave-like demo breakdown for mock mode (explicit numbers). */
const MOCK_BREAKDOWN_LIVEISH: KaminoHealthBreakdown = {
  liquidity: 79,
  riskConcentration: 92,
  liquidationRisk: 92,
  smartContractRisk: 68,
};

/** Frozen demo timestamp for stable SSR/hydration in mock mode. */
const MOCK_TS_MS = 1_700_000_000_000;

const MOCK_PAYLOAD = {
  snapshot: {
    metadata: {
      protocol: "kamino" as const,
      chainId: 0 as const,
      timestamp: MOCK_TS_MS,
      solanaCluster: "mainnet-beta" as const,
    },
    wallet:
      "DemoW111111111111111111111111111111111111111111111111111111",
    marketPubkey:
      "DemoM22222222222222222222222222222222222222222222222222222222",
    loanToValuePct: 54.25,
    reserveLabels: ["SOL", "USDC", "JitoSOL"],
    riskScore: 77,
    severity: "low" as const,
  },
  intelligence: {
    domain: "kamino-solana" as const,
    stage: "info" as const,
    composite01: 0.77,
    headline:
      "All risk dimensions within comfortable bounds relative to simulated Kamino utilization. Market regime: normal.",
    summary:
      "Kamino LTV is moderate with diversified reserves — monitor LTV drift on Solana mainnet-beta.",
    events: [
      {
        id: "mock-ev-1",
        timestamp: new Date(MOCK_TS_MS).toISOString(),
        message:
          "Mock obligation snapshot: LTV aligned with benign regime (demonstration data).",
        severity: "info" as const,
      },
      {
        id: "mock-ev-2",
        timestamp: new Date(MOCK_TS_MS).toISOString(),
        message:
          "Escalation stage INFO — illustrative snapshot; fetch a live snapshot for current market truth.",
        severity: "info" as const,
      },
    ],
  },
  copilot: {
    promptBlock: [
      "Agent Endo grounding (Kamino · demo snapshot).",
      "Protocol: Kamino Lending on Solana — illustrative obligation view for judges.",
      "Includes adapter risk score, severity band, reserve labels, and LTV% from the mock payload.",
      "Use a live snapshot from the API for mainnet-aligned Agent Endo context.",
    ].join("\n"),
  },
  latencyMs: 42,
};

const MOCK_PARSED = kaminoSnapshotResponseSchema.safeParse(MOCK_PAYLOAD);

if (!MOCK_PARSED.success) {
  throw new Error(
    `Kamino mock snapshot invalid: ${MOCK_PARSED.error.message}`,
  );
}

/** Validated demonstration payload (`NEXT_PUBLIC_KAMINO_USE_MOCK`). */
export const MOCK_KAMINO_SNAPSHOT_RESPONSE: KaminoSnapshotResponse =
  MOCK_PARSED.data;

export function isKaminoMockDashboardEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_KAMINO_USE_MOCK?.trim().toLowerCase();
  const explicitOff = raw === "0" || raw === "false" || raw === "no";
  if (explicitOff) return false;

  const explicitOn = raw === "1" || raw === "true";
  if (process.env.NODE_ENV === "production") {
    return explicitOn;
  }

  // `next dev`: default ON so Kamino matches Aave UX without a separate apps/web/.env.
  return explicitOn || raw === undefined || raw === "";
}

/** Use fixed Aave-like breakdown in mock mode for visual parity with marketing screenshots. */
export function getKaminoHealthBreakdown(
  data: KaminoSnapshotResponse,
  options: { useMockBreakdownStyling: boolean },
): KaminoHealthBreakdown {
  if (options.useMockBreakdownStyling) {
    return MOCK_BREAKDOWN_LIVEISH;
  }
  return deriveHealthBreakdownFromSnapshot(data.snapshot);
}
