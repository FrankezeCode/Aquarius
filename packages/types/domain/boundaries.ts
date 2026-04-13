/**
 * Cross-domain boundaries — AquariusDomainId and tagged payloads for CRE/events.
 *
 * @see docs/adr/0001-domains-and-boundaries.md
 *
 * Legacy ProtocolId (aave | lido | uniswap) coexists until a deliberate migration;
 * use legacyProtocolToDomain / LEGACY_PROTOCOL_TO_DOMAIN only where mapping is defined.
 */

import type { ProtocolId } from "../risk/base.js";

/** Stable domain identifier for URLs, logs, config, and routing. */
export type AquariusDomainId = "aave-evm" | "kamino-solana";

/** All domain IDs (extend when adding a bounded context). */
export const AQUARIUS_DOMAIN_IDS: readonly AquariusDomainId[] = [
  "aave-evm",
  "kamino-solana",
] as const;

/**
 * CRE- and event-facing envelope: domain-neutral spine + versioned payload.
 * CRE core should treat `payload` as opaque or map at the application edge only.
 */
export interface DomainTaggedPayload<T> {
  readonly domain: AquariusDomainId;
  /** Bump when the payload contract changes for the same domain. */
  readonly schemaVersion: string;
  readonly payload: T;
}

/**
 * Partial map from legacy ProtocolId to AquariusDomainId.
 * Only entries that are agreed are listed; extend when lido/uniswap domains are named.
 */
export const LEGACY_PROTOCOL_TO_DOMAIN: Partial<
  Record<ProtocolId, AquariusDomainId>
> = {
  aave: "aave-evm",
  kamino: "kamino-solana",
};

/**
 * Resolve legacy protocol to domain, or undefined if not yet mapped.
 */
export function legacyProtocolToDomain(
  protocol: ProtocolId
): AquariusDomainId | undefined {
  return LEGACY_PROTOCOL_TO_DOMAIN[protocol];
}
