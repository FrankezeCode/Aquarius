/**
 * Protocol Registry — Re-exports and extends protocol definitions for UI consumption.
 *
 * This file bridges the protocol modules (apps/web/protocols/) with the navigation system.
 * It adds display-level metadata (logo colors, status labels) without duplicating core data.
 */

import { protocols, protocolIds, type ProtocolId } from "@/protocols";

export interface ProtocolNavItem {
  id: string;
  name: string;
  status: "active" | "coming";
  slug: string;
}

/**
 * Build navigation-ready protocol list from the protocol registry.
 * Protocols auto-register here when added to /protocols/index.ts.
 */
export function getProtocolNavItems(): ProtocolNavItem[] {
  return protocolIds.map((id) => {
    const p = protocols[id];
    return {
      id: p.id,
      name: p.name,
      status: p.metadata.status === "active" ? "active" : "coming",
      slug: p.id,
    };
  });
}

export { protocols, protocolIds, type ProtocolId };
