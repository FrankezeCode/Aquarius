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

/**
 * Section 4 — Live Risk Event Feed
 * 
 * Purpose: Time-sensitivity & urgency
 * Terminal-style, auto-scrolling feed.
 * Must feel like "things are happening right now."
 * 
 * Rules:
 * - Chronological
 * - Numbers allowed only inside events
 * - No filters
 * - No interaction
 */
export function LiveRiskEventFeed({
  events,
  className,
}: LiveRiskEventFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <section
      className={cn("space-y-3", className)}
      aria-label="Live Risk Events"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Live Agent Feed
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div
        ref={feedRef}
        className="h-48 overflow-y-auto rounded-xl border border-border bg-black/40 font-mono text-sm"
        role="log"
        aria-live="polite"
      >
        {events.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Waiting for events...
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {events.map((event) => (
              <div key={event.id} className="flex gap-2">
                <span className="text-muted-foreground shrink-0">
                  [{event.timestamp}]
                </span>
                <span
                  className={cn(
                    "text-foreground",
                    event.severity && SEVERITY_COLORS[event.severity]
                  )}
                >
                  {event.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
