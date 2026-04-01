"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface RiskEvent {
  id: string;
  timestamp: string;
  message: string;
  severity?: "info" | "warning" | "critical";
}

interface LiveRiskEventFeedProps {
  events: RiskEvent[];
  className?: string;
}

const SEVERITY_COLORS = {
  info: "text-blue-400",
  warning: "text-amber-400",
  critical: "text-red-400",
} as const;

function highlightValues(message: string): React.ReactNode {
  const parts = message.split(/(\d+\.\d+|\b(?:MATCH|PROTECT_POSITION|ESCALATE|OBSERVE_ONLY|HIGH|CRITICAL|WARNING)\b)/g);

  return parts.map((part, i) => {
    if (/^\d+\.\d+$/.test(part)) {
      return (
        <span key={i} className="text-emerald-400">
          {part}
        </span>
      );
    }
    if (/^(MATCH|PROTECT_POSITION|ESCALATE)$/.test(part)) {
      return (
        <span key={i} className="text-cyan-400">
          {part}
        </span>
      );
    }
    if (/^(HIGH|CRITICAL|WARNING)$/.test(part)) {
      return (
        <span key={i} className="text-amber-400">
          {part}
        </span>
      );
    }
    if (/^OBSERVE_ONLY$/.test(part)) {
      return (
        <span key={i} className="text-emerald-400">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function LiveRiskEventFeed({
  events,
  className,
}: LiveRiskEventFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <section
      className={cn("space-y-0", className)}
      aria-label="Action Layer"
    >
      <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Action Layer
      </h3>

      <div className="rounded-xl border border-border bg-[#0a0a0c] overflow-hidden flex flex-col">
        {/* Terminal header bar */}
        <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2.5 border-b border-border/50 bg-[#111214] sm:px-4">
          <span className="min-w-0 truncate text-xs font-mono text-muted-foreground/80">
            root@aquarius-agent:~
          </span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Feed content */}
        <div
          ref={feedRef}
          className="h-[280px] overflow-y-auto font-mono text-[12px] leading-relaxed sm:text-[13px]"
          role="log"
          aria-live="polite"
        >
          {events.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Waiting for events...
            </div>
          ) : (
            <div className="space-y-1.5 p-3 sm:p-4">
              {events.map((event) => (
                <div key={event.id} className="flex min-w-0 gap-2 sm:gap-3">
                  <span className="shrink-0 tabular-nums text-muted-foreground/50">
                    {event.timestamp}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 break-words text-muted-foreground/90",
                      event.severity && SEVERITY_COLORS[event.severity],
                    )}
                  >
                    {highlightValues(event.message)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
