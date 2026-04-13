"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getSupportedChains,
  getDefaultChain,
  isChainSupportedByProtocol,
} from "@/registry/protocolChains";
import type { ChainDefinition } from "@/registry/chains";

export const MONITOR_PROTOCOL_STORAGE_KEY = "aquarius-monitor-protocol";

export type MonitorTargetProtocolId = "aave" | "kamino";

export function parseMonitorTargetProtocol(
  raw: string | null
): MonitorTargetProtocolId | null {
  if (raw === "aave" || raw === "kamino") return raw;
  return null;
}

export interface ProtocolChainState {
  /** Currently active protocol (from URL, e.g. "aave") */
  activeProtocol: string | null;
  /** Currently selected chain (state-based, not in URL) */
  activeChain: ChainDefinition | null;
  /** All chains supported by the active protocol */
  supportedChains: ChainDefinition[];
  /** Switch the active protocol (navigates to /protocol/{id}) */
  switchProtocol: (protocolId: string) => void;
  /** Switch the active chain (state only, no URL change) */
  switchChain: (chainId: string) => void;
  /** Global monitor target (persisted); URL overrides when under /protocol/aave|kamino */
  monitorTargetProtocolId: MonitorTargetProtocolId;
  setMonitorTargetProtocol: (id: MonitorTargetProtocolId) => void;
}

const ProtocolChainContext = createContext<ProtocolChainState | null>(null);

/**
 * Protocol + Chain context provider.
 *
 * - activeProtocol is derived from the URL path (/protocol/[protocol])
 * - activeChain is client-side state (defaults to first supported chain)
 * - Chain selection does NOT change the URL
 * - monitorTargetProtocolId is persisted; visiting /protocol/aave or /protocol/kamino syncs it
 */
export function ProtocolChainProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Derive active protocol from URL
  const match = pathname.match(/^\/protocol\/([^/]+)/);
  const activeProtocol = match?.[1] ?? null;

  // Resolve chains for current protocol
  const supportedChains = activeProtocol
    ? getSupportedChains(activeProtocol)
    : [];
  const defaultChain = activeProtocol
    ? getDefaultChain(activeProtocol)
    : undefined;

  // Chain state — defaults to protocol's first supported chain
  const [chainState, setChainState] = useState<Record<string, string>>({});

  const [monitorTargetProtocolId, setMonitorTargetProtocolId] =
    useState<MonitorTargetProtocolId>("aave");

  const activeChainId = activeProtocol
    ? chainState[activeProtocol] ?? defaultChain?.id
    : undefined;

  const activeChain =
    supportedChains.find((c) => c.id === activeChainId) ?? defaultChain ?? null;

  const setMonitorTargetProtocol = useCallback(
    (id: MonitorTargetProtocolId) => {
      setMonitorTargetProtocolId(id);
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(MONITOR_PROTOCOL_STORAGE_KEY, id);
        }
      } catch {
        // ignore quota / private mode
      }
    },
    []
  );

  useEffect(() => {
    const stored = parseMonitorTargetProtocol(
      localStorage.getItem(MONITOR_PROTOCOL_STORAGE_KEY)
    );
    if (stored) {
      setMonitorTargetProtocolId(stored);
    }
  }, []);

  useEffect(() => {
    const segment = pathname.match(/^\/protocol\/([^/]+)/)?.[1];
    if (segment === "aave" || segment === "kamino") {
      setMonitorTargetProtocol(segment);
    }
  }, [pathname, setMonitorTargetProtocol]);

  const switchProtocol = useCallback(
    (protocolId: string) => {
      router.push(`/protocol/${protocolId}`);
    },
    [router]
  );

  const switchChain = useCallback(
    (chainId: string) => {
      if (!activeProtocol) return;
      if (!isChainSupportedByProtocol(activeProtocol, chainId)) return;

      setChainState((prev) => ({
        ...prev,
        [activeProtocol]: chainId,
      }));
    },
    [activeProtocol]
  );

  return (
    <ProtocolChainContext.Provider
      value={{
        activeProtocol,
        activeChain,
        supportedChains,
        switchProtocol,
        switchChain,
        monitorTargetProtocolId,
        setMonitorTargetProtocol,
      }}
    >
      {children}
    </ProtocolChainContext.Provider>
  );
}

/**
 * Access the protocol + chain context.
 * Must be used within ProtocolChainProvider.
 */
export function useProtocolChain(): ProtocolChainState {
  const ctx = useContext(ProtocolChainContext);
  if (!ctx) {
    throw new Error(
      "useProtocolChain must be used within a ProtocolChainProvider"
    );
  }
  return ctx;
}
