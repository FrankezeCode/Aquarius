import { KaminoRiskSnapshotClient } from "@/components/kamino/kamino-risk-snapshot-client";

/**
 * Kamino (Solana) — read-path risk snapshot (Phase B).
 */

export default function KaminoProtocolPage() {
  return (
    <main className="container max-w-3xl py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Kamino</h1>
      <p className="mt-2 text-muted-foreground">
        Kamino Lending on Solana — live read model via{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">
          /api/v1/kamino-risk/snapshot
        </code>
        . Configure the API with{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">
          SOLANA_RPC_URL
        </code>{" "}
        (and optionally{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">
          KAMINO_MARKET_PUBKEY
        </code>
        ).
      </p>
      <KaminoRiskSnapshotClient />
    </main>
  );
}
