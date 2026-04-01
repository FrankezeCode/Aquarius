"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RiskCopilotPanel } from "./risk-copilot-panel";
import { cn } from "@/lib/utils";

interface FloatingRiskCopilotProps {
  chain: string;
  walletAddress?: string;
  suppressWhenModalOpen?: boolean;
}

export function FloatingRiskCopilot({
  chain,
  walletAddress,
  suppressWhenModalOpen = false,
}: FloatingRiskCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showContextPulse, setShowContextPulse] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const contextKey = useMemo(
    () => `${chain}:${walletAddress ?? "disconnected"}`,
    [chain, walletAddress]
  );
  const previousContextRef = useRef(contextKey);

  useEffect(() => {
    if (previousContextRef.current !== contextKey) {
      previousContextRef.current = contextKey;
      if (!isOpen) {
        setShowContextPulse(true);
      }
    }
  }, [contextKey, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };

    /** Radix Select/Dropdown portals to `document.body`; native `<select>` menus are also outside this tree. */
    function isOutsideCopilotButInsidePortalledOverlay(target: EventTarget | null) {
      if (!target || !(target instanceof Element)) return false;
      return Boolean(
        target.closest("[data-radix-popper-content-wrapper]") ||
          target.closest("[data-radix-select-viewport]") ||
          target.closest('[role="listbox"]'),
      );
    }

    const onPointerDownOutside = (event: PointerEvent) => {
      const target = event.target;
      if (target && containerRef.current?.contains(target as Node)) return;
      if (isOutsideCopilotButInsidePortalledOverlay(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDownOutside, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDownOutside, true);
    };
  }, [isOpen]);

  function openPanel() {
    setIsOpen(true);
    setShowContextPulse(false);
    setFocusSignal((current) => current + 1);
  }

  function closePanel() {
    setIsOpen(false);
    launcherRef.current?.focus();
  }

  function togglePanel() {
    if (isOpen) {
      closePanel();
      return;
    }
    openPanel();
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none fixed bottom-6 right-4 z-[90] transition-all duration-200 md:bottom-6 md:right-6 motion-reduce:transition-none",
        suppressWhenModalOpen && "pointer-events-none translate-x-6 opacity-0"
      )}
    >
      {isOpen ? (
        <div
          id="risk-copilot-dialog"
          role="dialog"
          aria-label="Risk Copilot"
          aria-modal="false"
          className={cn(
            "pointer-events-auto mb-3 w-[calc(100vw-1.5rem)] max-w-[460px] origin-bottom-right rounded-xl translate-y-0 scale-100 opacity-100 transition-all duration-200 motion-reduce:transition-none"
          )}
        >
          <div
            className={cn(
              "h-[min(74vh,640px)] overflow-hidden rounded-2xl border border-slate-600/40 bg-[#0f1115] shadow-[0_20px_70px_-28px_rgba(0,0,0,0.95),0_0_0_1px_rgba(30,41,59,0.22)]"
            )}
          >
            <RiskCopilotPanel
              chain={chain}
              walletAddress={walletAddress}
              onClose={closePanel}
              autoFocusSignal={focusSignal}
              className="h-full overflow-y-auto border-0 bg-[#0f1115] p-4"
            />
          </div>
        </div>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        onClick={togglePanel}
        aria-label={isOpen ? "Collapse Risk Copilot" : "Open Risk Copilot"}
        aria-expanded={isOpen}
        aria-controls="risk-copilot-dialog"
        className={cn(
          "pointer-events-auto group inline-flex items-center gap-2 rounded-full border border-slate-600/45 bg-[#121317]/95 px-2 py-2 text-left shadow-[0_10px_35px_-18px_rgba(0,0,0,0.95)] transition-all duration-200 hover:border-slate-500/55 hover:bg-[#171920]/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
        )}
      >
        <span
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/50 bg-gradient-to-br from-cyan-300/30 via-sky-300/20 to-blue-300/15 text-[11px] font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.33)]"
          )}
        >
          AE
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#101114] bg-emerald-300/95" />
          {showContextPulse && !isOpen && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] motion-safe:animate-pulse" />
          )}
        </span>
        <span className="rounded-full border border-slate-600/45 bg-slate-800/30 px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground/90">
          Ask Agent Endo
        </span>
      </button>
    </div>
  );
}

