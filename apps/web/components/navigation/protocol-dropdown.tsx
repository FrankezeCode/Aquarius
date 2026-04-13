"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProtocolRow } from "./protocol-row";
import { getProtocolNavItems } from "@/registry/protocols";
import { getSupportedChains, getDefaultChain } from "@/registry/protocolChains";
import { useProtocolChain } from "@/context/protocol-chain-context";

interface ProtocolDropdownProps {
  className?: string;
}

/**
 * Protocol Dropdown — main navigation dropdown.
 *
 * LEFT column: list of protocols (Aave active, others "Soon").
 * RIGHT: network selector appears inline for the active protocol.
 *
 * Chains are loaded dynamically from the protocol's supportedChains.
 * No hardcoded chain lists — adding a chain auto-updates the dropdown.
 */
export function ProtocolDropdown({ className }: ProtocolDropdownProps) {
  const { activeProtocol, activeChain, switchChain, setMonitorTargetProtocol } =
    useProtocolChain();
  const navItems = getProtocolNavItems();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
            className
          )}
        >
          Protocols
          <ChevronDown className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto min-w-[280px] p-0"
      >
        <div className="py-1">
          {navItems.map((item) => {
            const isActive = item.status === "active";
            const chains = isActive ? getSupportedChains(item.slug) : [];
            const currentChain =
              item.slug === activeProtocol
                ? activeChain
                : isActive
                  ? getDefaultChain(item.slug) ?? null
                  : null;

            return (
              <ProtocolRow
                key={item.slug}
                name={item.name}
                slug={item.slug}
                status={item.status}
                isCurrentProtocol={item.slug === activeProtocol}
                chains={chains}
                activeChain={currentChain}
                onChainSelect={switchChain}
                onNavigate={() => {
                  /* Popover auto-closes on click outside */
                }}
                onActiveProtocolSelect={(slug) => {
                  if (slug === "aave" || slug === "kamino") {
                    setMonitorTargetProtocol(slug);
                  }
                }}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
