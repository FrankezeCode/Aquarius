"use client";

import {
  getSolanaWalletLabel,
  type SolanaWalletKind,
} from "@/adapters/kamino-solana/solana-wallet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectSolanaWalletCtaProps {
  /**
   * Wallet kinds whose injected provider was detected in this browser.
   * If empty, the buttons are still rendered but disabled with an
   * "install a wallet" hint.
   */
  installedWallets: readonly SolanaWalletKind[];
  /** Kind currently being connected, if any (drives the per-button spinner). */
  connectingKind: SolanaWalletKind | null;
  onConnect: (kind: SolanaWalletKind) => void | Promise<void>;
  onSimulateDemoWallet?: () => void;
  className?: string;
}

const SUPPORTED_KINDS: readonly SolanaWalletKind[] = ["phantom", "backpack"];

const WALLET_BUTTON_CLASSES: Record<SolanaWalletKind, string> = {
  phantom:
    "border border-violet-500/40 bg-violet-950/40 text-violet-100 hover:bg-violet-900/50",
  backpack:
    "border border-rose-500/40 bg-rose-950/40 text-rose-100 hover:bg-rose-900/50",
};

/**
 * Solana parallel to Aave `ConnectWalletCTA`. Renders a connect button
 * per supported wallet kind, plus an optional scripted demo wallet.
 */
export function ConnectSolanaWalletCta({
  installedWallets,
  connectingKind,
  onConnect,
  onSimulateDemoWallet,
  className,
}: ConnectSolanaWalletCtaProps) {
  const isAnyConnecting = connectingKind !== null;
  const hasAnyInstalled = installedWallets.length > 0;

  return (
    <section
      className={cn("flex flex-col items-center gap-4 py-8", className)}
      aria-label="Connect Solana wallet"
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        {SUPPORTED_KINDS.map((kind) => {
          const isInstalled = installedWallets.includes(kind);
          const isConnectingThis = connectingKind === kind;
          // Buttons are always clickable: detection is best-effort and racy
          // across browsers/extensions. The real test is whether `connect()`
          // succeeds — if not, the adapter throws a typed error and the
          // caller surfaces an actionable install message.
          const disabled = isAnyConnecting;
          const dimmed = !isInstalled && !isConnectingThis;
          return (
            <Button
              key={kind}
              size="lg"
              type="button"
              onClick={() => void onConnect(kind)}
              disabled={disabled}
              className={cn(
                "h-14 px-10 text-base font-semibold",
                WALLET_BUTTON_CLASSES[kind],
                dimmed && "opacity-70",
              )}
              aria-label={`Connect ${getSolanaWalletLabel(kind)} wallet`}
              title={
                isInstalled
                  ? undefined
                  : `${getSolanaWalletLabel(kind)} not detected yet — click to try connecting anyway`
              }
            >
              {isConnectingThis ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]" />
                  Connecting…
                </>
              ) : (
                `Connect ${getSolanaWalletLabel(kind)}`
              )}
            </Button>
          );
        })}
        {onSimulateDemoWallet ? (
          <Button
            size="lg"
            variant="outline"
            type="button"
            onClick={onSimulateDemoWallet}
            disabled={isAnyConnecting}
            className="h-14 border-dashed border-muted-foreground/50 px-8 text-base"
          >
            Use demo wallet
          </Button>
        ) : null}
      </div>
      {!hasAnyInstalled ? (
        <p className="max-w-lg text-center text-xs text-muted-foreground">
          No Solana wallet detected yet — extensions sometimes inject after
          this page loads.{" "}
          <span className="text-foreground">Click any button anyway</span> and
          we&apos;ll try to connect. If nothing happens, install{" "}
          <a
            href="https://phantom.app/download"
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Phantom
          </a>{" "}
          or{" "}
          <a
            href="https://backpack.app/downloads"
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Backpack
          </a>
          , unlock it, then reload — or use the demo wallet to walk through the
          guided flow.
        </p>
      ) : (
        <p className="max-w-lg text-center text-xs text-muted-foreground">
          Connect your wallet to associate this obligation view with your owner
          address on this device. The page reads snapshot data via the Aquarius
          API and never sends Solana transactions from here.
        </p>
      )}
    </section>
  );
}
