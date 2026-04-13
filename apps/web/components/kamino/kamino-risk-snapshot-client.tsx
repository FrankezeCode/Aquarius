"use client";

import { useState, type FormEvent } from "react";

const DEFAULT_API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type SnapshotResponse = {
  snapshot: {
    loanToValuePct: number;
    severity: string;
    riskScore: number;
    reserveLabels: readonly string[];
    marketPubkey: string;
  };
  intelligence: {
    stage: string;
    headline: string;
    summary: string;
    composite01: number;
    events: readonly { message: string; severity: string }[];
  };
  copilot: { promptBlock: string };
  latencyMs: number;
};

type ErrorBody = {
  error: { code: string; message: string; retryAfterMs?: number };
};

export function KaminoRiskSnapshotClient() {
  const [wallet, setWallet] = useState("");
  const [market, setMarket] = useState("");
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SnapshotResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setResult(null);
    setLoading(true);
    try {
      const q = new URLSearchParams({ wallet: wallet.trim() });
      if (market.trim()) q.set("market", market.trim());
      if (policy.trim()) q.set("policy", policy.trim());
      const res = await fetch(
        `${DEFAULT_API}/api/v1/kamino-risk/snapshot?${q.toString()}`
      );
      const json = (await res.json()) as SnapshotResponse | ErrorBody;
      if (!res.ok) {
        const e = json as ErrorBody;
        setErr(
          `${e.error?.code ?? "ERROR"}: ${e.error?.message ?? res.statusText}`
        );
        return;
      }
      setResult(json as SnapshotResponse);
    } catch (caught) {
      setErr(
        caught instanceof Error ? caught.message : "Request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-6 rounded-xl border border-border bg-card/40 p-6">
      <h2 className="text-lg font-medium">Live risk snapshot</h2>
      <p className="text-sm text-muted-foreground">
        Calls{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          GET /api/v1/kamino-risk/snapshot
        </code>
        . Set{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          SOLANA_RPC_URL
        </code>{" "}
        on the API and use a mainnet wallet with a vanilla Kamino obligation.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="km-wallet">
            Wallet (owner)
          </label>
          <input
            id="km-wallet"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="Base58 owner pubkey"
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="km-market">
            Market (lending) pubkey
          </label>
          <input
            id="km-market"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            placeholder="Optional if API has KAMINO_MARKET_PUBKEY"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="km-policy">
            Policy note (optional)
          </label>
          <input
            id="km-policy"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            placeholder="Short note for copilot context"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Loading…" : "Fetch snapshot"}
        </button>
      </form>
      {err ? (
        <p className="text-sm text-destructive">{err}</p>
      ) : null}
      {result ? (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Latency: {result.latencyMs} ms
          </p>
          <p className="font-medium">{result.intelligence.headline}</p>
          <p className="text-muted-foreground">{result.intelligence.summary}</p>
          <p>
            Stage:{" "}
            <span className="font-mono">{result.intelligence.stage}</span> ·
            LTV: {result.snapshot.loanToValuePct.toFixed(2)}% · Severity:{" "}
            {result.snapshot.severity}
          </p>
          <div className="rounded-md bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap">
            {result.copilot.promptBlock}
          </div>
        </div>
      ) : null}
    </div>
  );
}
