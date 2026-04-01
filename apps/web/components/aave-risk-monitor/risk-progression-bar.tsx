"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface RiskProgression {
  stage: "info" | "confirm" | "invalidate";
  accumulator: number;
  convergenceSignals: string[];
  enteredAt: number;
  transitionReason: string;
  lastAction: {
    type: string;
    success: boolean;
    timestamp: number;
  } | null;
  actionRequired: "none" | "protect" | "escalate";
  velocity?: number;
  stageStability?: "stable" | "transitioning" | "escalating";
  timeline?: Array<{
    type: string;
    timestamp: number;
    reason: string;
  }>;
}

interface RiskProgressionBarProps {
  progression: RiskProgression;
  className?: string;
}

const STAGE_CONFIG = {
  info: {
    label: "INFO LAYER",
    sublabel: "Signals building",
    activeRing: "border-blue-500 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]",
    inactiveRing: "border-blue-500/40 bg-transparent",
    labelClass: "text-blue-400 font-bold",
    gradientFrom: "from-blue-500",
  },
  confirm: {
    label: "CONFIRM",
    sublabel: "Action triggered",
    activeRing: "border-amber-500 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]",
    inactiveRing: "border-amber-500/40 bg-transparent",
    labelClass: "text-amber-400 font-bold",
    gradientFrom: "from-amber-500",
  },
  invalidate: {
    label: "INVALIDATE",
    sublabel: "Escalation required",
    activeRing: "border-red-500 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]",
    inactiveRing: "border-muted-foreground/30 bg-transparent",
    labelClass: "text-red-400 font-bold",
    gradientFrom: "from-red-500",
  },
} as const;

const STAGES = ["info", "confirm", "invalidate"] as const;

/** Keeps stage titles in distinct columns; shorter copy on xs to avoid overlap. */
function StageLabelContent({ stageKey }: { stageKey: (typeof STAGES)[number] }) {
  if (stageKey === "info") {
    return (
      <>
        <span className="block leading-tight">INFO</span>
        <span className="block leading-tight">LAYER</span>
      </>
    );
  }
  if (stageKey === "confirm") {
    return <span className="block leading-tight">CONFIRM</span>;
  }
  return (
    <>
      <span className="block leading-tight sm:hidden">INVALID</span>
      <span className="hidden leading-tight sm:block">INVALIDATE</span>
    </>
  );
}

const STABILITY_CONFIG = {
  stable: {
    label: "Stable",
    className: "bg-muted text-muted-foreground",
  },
  transitioning: {
    label: "Transitioning",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  escalating: {
    label: "Escalating",
    className: "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse",
  },
} as const;

function formatTimelineTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false });
}

function StageMarker({
  isActive,
  isPast,
  stageKey,
}: {
  isActive: boolean;
  isPast: boolean;
  stageKey: (typeof STAGES)[number];
}) {
  const config = STAGE_CONFIG[stageKey];

  if (isActive || isPast) {
    return (
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 transition-all duration-300",
          config.activeRing,
        )}
      />
    );
  }

  if (stageKey === "confirm") {
    return (
      <div
        className="h-5 w-5 rounded-full border-2 border-amber-500 bg-transparent shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-all duration-300"
      />
    );
  }

  if (stageKey === "invalidate") {
    return (
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
          config.inactiveRing,
        )}
      >
        <span className="text-[8px] text-muted-foreground/60 leading-none tracking-widest">
          ···
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-5 w-5 rounded-full border-2 transition-all duration-300",
        config.inactiveRing,
      )}
    />
  );
}

export function RiskProgressionBar({
  progression,
  className,
}: RiskProgressionBarProps) {
  const {
    stage,
    accumulator,
    convergenceSignals,
    transitionReason,
    lastAction,
  } = progression;
  const [timelineOpen, setTimelineOpen] = useState(false);
  const activeIndex = STAGES.indexOf(stage);

  const stability = progression.stageStability ?? "stable";
  const stabilityCfg = STABILITY_CONFIG[stability];
  const velocity = progression.velocity;
  const timeline = progression.timeline;

  const timeSinceEntry = Math.round(
    (Date.now() - progression.enteredAt) / 1000,
  );
  const timeLabel =
    timeSinceEntry < 60
      ? `${timeSinceEntry}s`
      : `${Math.round(timeSinceEntry / 60)}m`;

  const rawTrackPercent =
    activeIndex === 0
      ? Math.min(50, (accumulator / 40) * 50)
      : activeIndex === 1
        ? 50 + Math.min(50, ((accumulator - 40) / 30) * 50)
        : 100;
  const trackPercent = Math.max(8, rawTrackPercent);

  return (
    <section
      className={cn("space-y-4", className)}
      aria-label="Risk Progression"
    >
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          SELVA Risk Progression
        </h3>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium",
            stabilityCfg.className,
          )}
        >
          {stabilityCfg.label}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3 sm:p-6">
        {/* Metadata row — stacked on mobile so accumulator never overlaps sublabel */}
        <div>
          {/* Mobile */}
          <div className="flex flex-col gap-2 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">
                {timeLabel}
              </span>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {accumulator.toFixed(1)} / 100
              </span>
            </div>
            <p className="text-xs leading-snug text-muted-foreground">
              {STAGE_CONFIG[stage].sublabel}
            </p>
            <div className="flex justify-end">
              {lastAction ? (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50",
                    lastAction.success
                      ? "text-emerald-400"
                      : "text-red-400",
                  )}
                >
                  {lastAction.success ? "\u2713" : "\u2717"} {lastAction.type}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">
                  ··
                </span>
              )}
            </div>
          </div>

          {/* md+ — centered accumulator; relative so absolute is scoped to this row */}
          <div className="relative hidden w-full items-center justify-between px-[2px] md:flex">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">
                {timeLabel}
              </span>
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {STAGE_CONFIG[stage].sublabel}
              </span>
            </div>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-mono tabular-nums text-muted-foreground">
              {accumulator.toFixed(1)} / 100
            </span>
            <div className="flex flex-1 justify-end">
              {lastAction ? (
                <span
                  className={cn(
                    "shrink-0 text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50",
                    lastAction.success
                      ? "text-emerald-400"
                      : "text-red-400",
                  )}
                >
                  {lastAction.success ? "\u2713" : "\u2717"} {lastAction.type}
                </span>
              ) : (
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">
                  ··
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dark charcoal panel — distinct control surface */}
        <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#111214] px-3 py-3 sm:px-5 sm:py-4">
          {/* Track with stage markers */}
          <div className="relative flex h-5 items-center">
            {/* Inactive track (full width, dark muted grey) */}
            <div className="absolute left-[10px] right-[10px] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#1a1c20]" />

            {/* Active filled track (vibrant cyan with directional pulse) */}
            <div
              className="absolute left-[10px] top-1/2 h-[3px] -translate-y-1/2 rounded-full"
              style={{
                width: `calc(${trackPercent}% - 20px)`,
                background: "linear-gradient(90deg, #06b6d4, #22d3ee)",
                transformOrigin: "left center",
                animation:
                  velocity !== undefined && velocity > 0
                    ? "barPulseForward 2s ease-in-out infinite"
                    : velocity !== undefined && velocity < 0
                      ? "barPulseBackward 2s ease-in-out infinite"
                      : "none",
              }}
            />

            {/* Stage markers */}
            {STAGES.map((s, index) => {
              const isActive = stage === s;
              const isPast = index < activeIndex;
              const position =
                index === 0 ? "left-0" : index === 1 ? "left-1/2 -translate-x-1/2" : "right-0";

              return (
                <div
                  key={s}
                  className={cn("absolute z-10", position)}
                >
                  <StageMarker
                    isActive={isActive}
                    isPast={isPast}
                    stageKey={s}
                  />
                </div>
              );
            })}
          </div>

          {/* Stage labels — grid locks each title to its column (no CONFIRM + INVALIDATE merge) */}
          <div className="grid min-w-0 grid-cols-3 gap-x-2 sm:gap-x-4">
            {STAGES.map((s) => {
              const config = STAGE_CONFIG[s];
              const isActive = stage === s;
              const isPast = STAGES.indexOf(s) < activeIndex;

              return (
                <div
                  key={s}
                  className={cn(
                    "min-w-0 px-0.5",
                    s === "info" && "text-left",
                    s === "confirm" && "text-center",
                    s === "invalidate" && "text-right",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block max-w-full break-words text-[9px] font-bold uppercase leading-snug tracking-tight transition-colors sm:text-[11px] sm:tracking-wider",
                      isActive || isPast
                        ? config.labelClass
                        : "text-muted-foreground/50",
                    )}
                  >
                    <StageLabelContent stageKey={s} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Convergence signals */}
        {convergenceSignals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {convergenceSignals.map((signal) => (
              <span
                key={signal}
                className="text-[10px] px-2 py-0.5 rounded border border-border/50 text-muted-foreground/70 bg-muted/30"
              >
                {signal}
              </span>
            ))}
          </div>
        )}

        {/* Metadata footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground/60 border-t border-border/50 pt-3">
          <span>{transitionReason}</span>
          <span className="font-mono tabular-nums">
            Stage active: {timeLabel}
          </span>
        </div>

        {/* Delta Accumulator — centered */}
        {velocity !== undefined && (
          <div className="flex flex-col items-center gap-0.5 pt-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
              {velocity >= 0 ? "\u25B2" : "\u25BC"} Delta Accumulator (60s)
            </span>
            <span
              className={cn(
                "text-sm font-mono tabular-nums font-semibold",
                velocity > 0
                  ? "text-red-400"
                  : velocity < 0
                    ? "text-emerald-400"
                    : "text-muted-foreground/60",
              )}
            >
              {velocity > 0 ? "+" : ""}
              {velocity.toFixed(2)}
            </span>
          </div>
        )}

        {/* Escalation Timeline (Audit Trail) */}
        {timeline && timeline.length > 0 && (
          <div className="border-t border-border/50 pt-3">
            <button
              type="button"
              onClick={() => setTimelineOpen((prev) => !prev)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <span
                className={cn(
                  "transition-transform duration-200 text-[10px]",
                  timelineOpen ? "rotate-90" : "",
                )}
              >
                {"\u25B6"}
              </span>
              <span className="uppercase tracking-wider font-medium">
                Audit Trail ({timeline.length} events)
              </span>
            </button>
            {timelineOpen && (
              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                {timeline.map((entry, idx) => (
                  <div
                    key={`${entry.timestamp}-${idx}`}
                    className="flex gap-3 text-xs font-mono text-muted-foreground"
                  >
                    <span className="text-muted-foreground/60 shrink-0">
                      [{formatTimelineTime(entry.timestamp)}]
                    </span>
                    <span
                      className={cn(
                        "shrink-0 uppercase",
                        entry.type.includes("INVALIDATE")
                          ? "text-red-400"
                          : entry.type.includes("CONFIRM")
                            ? "text-amber-400"
                            : entry.type.includes("FAILED")
                              ? "text-red-400"
                              : entry.type.includes("SUCCEEDED")
                                ? "text-emerald-400"
                                : "text-blue-400",
                      )}
                    >
                      {entry.type}
                    </span>
                    <span className="truncate">{entry.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
