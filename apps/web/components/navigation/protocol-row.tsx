"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { NetworkSwitcher } from "./network-switcher";
import type { ChainDefinition } from "@/registry/chains";

interface ProtocolRowProps {
  name: string;
  slug: string;
  status: "active" | "coming";
  isCurrentProtocol: boolean;
  chains: ChainDefinition[];
  activeChain: ChainDefinition | null;
  onChainSelect: (chainId: string) => void;
  onNavigate: () => void;
  /** When set, invoked for aave/kamino when the protocol link is activated */
  onActiveProtocolSelect?: (slug: string) => void;
}

/**
 * Protocol Row — single row inside the Protocols dropdown.
 *
 * Active protocols: clickable link + NetworkSwitcher on the right.
 * Coming-soon protocols: dimmed with "Soon" badge, not clickable.
 */
export function ProtocolRow({
  name,
  slug,
  status,
  isCurrentProtocol,
  chains,
  activeChain,
  onChainSelect,
  onNavigate,
  onActiveProtocolSelect,
}: ProtocolRowProps) {
  if (status === "coming") {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed">
        <span>{name}</span>
        <span className="rounded bg-secondary px-2 py-0.5 text-xs">Soon</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors",
        isCurrentProtocol ? "bg-accent/50" : ""
      )}
    >
      <Link
        href={`/protocol/${slug}`}
        onClick={() => {
          onNavigate();
          if (slug === "aave" || slug === "kamino") {
            onActiveProtocolSelect?.(slug);
          }
        }}
        className={cn(
          "font-medium transition-colors hover:text-foreground",
          isCurrentProtocol ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {name}
      </Link>

      {activeChain && chains.length > 0 && (
        <NetworkSwitcher
          chains={chains}
          activeChain={activeChain}
          onChainSelect={onChainSelect}
        />
      )}
    </div>
  );
}
