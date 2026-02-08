"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EnableAlertsCTAProps {
  onEnableAlerts: () => void;
  isEnabled?: boolean;
  className?: string;
}

/**
 * Section 7 — Final Action (Peak-End Rule)
 * 
 * Purpose: Emotional closure & safety
 * The user should leave feeling protected.
 * 
 * Alert channels:
 * - Telegram
 * - Web push
 * - Webhook (for dev wallets)
 */
export function EnableAlertsCTA({
  onEnableAlerts,
  isEnabled = false,
  className,
}: EnableAlertsCTAProps) {
  return (
    <section
      className={cn("flex flex-col items-center py-8 text-center", className)}
      aria-label="Enable Alerts"
    >
      <p className="mb-6 text-lg text-muted-foreground">
        Get alerted before your risk escalates.
      </p>

      {isEnabled ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-4">
          <span className="text-xl">✓</span>
          <span className="font-medium text-emerald-400">Alerts Enabled</span>
        </div>
      ) : (
        <Button
          size="lg"
          onClick={onEnableAlerts}
          className="h-14 px-10 text-base font-semibold"
        >
          Enable Alerts
        </Button>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Telegram · Web Push · Webhook
      </p>
    </section>
  );
}
