"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectWalletCTAProps {
  onConnect: () => void;
  isConnecting?: boolean;
  className?: string;
}

/**
 * Section 5 — Primary CTA
 * 
 * Purpose: Wayfinding & Decision
 * One button only — centered, visually dominant.
 * No competing CTAs nearby.
 */
export function ConnectWalletCTA({
  onConnect,
  isConnecting = false,
  className,
}: ConnectWalletCTAProps) {
  return (
    <section
      className={cn("flex flex-col items-center py-8", className)}
      aria-label="Connect Wallet"
    >
      <Button
        size="lg"
        onClick={onConnect}
        disabled={isConnecting}
        className="h-14 px-10 text-base font-semibold"
      >
        {isConnecting ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Connecting...
          </>
        ) : (
          "Connect Wallet to Monitor Your Risk"
        )}
      </Button>
    </section>
  );
}
