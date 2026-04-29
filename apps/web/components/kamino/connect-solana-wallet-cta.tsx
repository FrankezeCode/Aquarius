"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectSolanaWalletCtaProps {
  onConnect: () => void | Promise<void>;
  isConnecting?: boolean;
  phantomAvailable: boolean;
  onSimulateDemoWallet?: () => void;
  className?: string;
}

/** Solana parallel to Aave `ConnectWalletCTA` — Phantom + optional scripted demo wallet. */
export function ConnectSolanaWalletCta({
  onConnect,
  isConnecting = false,
  phantomAvailable,
  onSimulateDemoWallet,
  className,
}: ConnectSolanaWalletCtaProps) {
  return (
    <section
      className={cn("flex flex-col items-center gap-4 py-8", className)}
      aria-label="Connect Solana wallet"
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button
          size="lg"
          type="button"
          onClick={() => void onConnect()}
          disabled={isConnecting || !phantomAvailable}
          className={cn(
            "h-14 px-10 text-base font-semibold",
            "border border-violet-500/40 bg-violet-950/40 text-violet-100 hover:bg-violet-900/50",
            (!phantomAvailable || isConnecting) && "opacity-60",
          )}
        >
          {isConnecting ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]" />
              Connecting…
            </>
          ) : (
            "Connect Phantom (Solana)"
          )}
        </Button>
        {onSimulateDemoWallet ? (
          <Button
            size="lg"
            variant="outline"
            type="button"
            onClick={onSimulateDemoWallet}
            disabled={isConnecting}
            className="h-14 border-dashed border-muted-foreground/50 px-8 text-base"
          >
            Use demo wallet
          </Button>
        ) : null}
      </div>
      {!phantomAvailable ? (
        <p className="max-w-lg text-center text-xs text-muted-foreground">
          Phantom is not detected. Install the Phantom extension for Solana,{" "}
          <span className="text-foreground">Use demo wallet</span> to continue the guided flow, or
          paste an owner address in{" "}
          <span className="font-medium text-foreground">Solana snapshot (API)</span>.
        </p>
      ) : (
        <p className="max-w-lg text-center text-xs text-muted-foreground">
          Connect Phantom to associate this obligation view with your owner address on this device.
          This page loads snapshot data via the Aquarius API; it does not send Solana transactions
          here.
        </p>
      )}
    </section>
  );
}
