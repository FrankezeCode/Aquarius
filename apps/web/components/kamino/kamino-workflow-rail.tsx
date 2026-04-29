"use client";

import { cn } from "@/lib/utils";

export type KaminoWorkflowHighlight = "snapshot" | "wallet" | "review";

interface KaminoWorkflowRailProps {
  obligationSnapshotLoaded: boolean;
  walletLinked: boolean;
  /** Highlighted step rail (derived in parent). */
  highlight: KaminoWorkflowHighlight;
}

const ROWS = [
  {
    id: "snapshot" as const,
    title: "Obligation snapshot",
    subtitle: "Kamino read model",
  },
  {
    id: "wallet" as const,
    title: "Solana wallet",
    subtitle: "Phantom or demo wallet",
  },
  {
    id: "review" as const,
    title: "Review obligations",
    subtitle: "Metrics & SELVA",
  },
];

function stepCompleted(
  id: KaminoWorkflowHighlight,
  obligationSnapshotLoaded: boolean,
  walletLinked: boolean,
): boolean {
  if (id === "snapshot") return obligationSnapshotLoaded;
  if (id === "wallet") return walletLinked;
  return obligationSnapshotLoaded && walletLinked;
}

/** Three-step progression for onboarding (mock or live obligation data). */
export function KaminoWorkflowRail({
  obligationSnapshotLoaded,
  walletLinked,
  highlight,
}: KaminoWorkflowRailProps) {
  return (
    <nav
      aria-label="Workflow"
      className="rounded-xl border border-border/55 bg-card/25 px-3 py-4 sm:px-5"
    >
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {ROWS.map((row, idx) => {
          const active = highlight === row.id;
          const done = stepCompleted(row.id, obligationSnapshotLoaded, walletLinked);
          return (
            <li
              key={row.id}
              className={cn(
                "relative flex min-w-0 flex-1 gap-3 border-l-2 pl-3 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-3",
                done ? "border-emerald-500/70" : active ? "border-cyan-400/80" : "border-border/50",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done
                    ? "bg-emerald-500/20 text-emerald-300"
                    : active
                      ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                      : "bg-muted/40 text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? "\u2713" : idx + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {row.title}
                </p>
                <p className="text-[11px] text-muted-foreground">{row.subtitle}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
