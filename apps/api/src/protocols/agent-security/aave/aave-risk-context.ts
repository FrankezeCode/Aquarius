/**
 * Aave Risk Context — Re-export from Aave Domain
 *
 * Bounded context: Agent Security / Aave
 *
 * Re-exports the canonical AaveRiskSnapshot DTO from the Aave domain.
 * The agent-security layer does NOT define its own risk snapshot type —
 * it consumes the DTO produced by risk-intelligence.
 *
 * DDD rule: Risk data is defined ONCE in the Aave domain.
 * Agent-security only consumes pre-computed snapshots.
 *
 * Import direction: agent-security → aave/domain (allowed)
 * Reverse import:   aave → agent-security (FORBIDDEN)
 */

export type { AaveRiskSnapshot } from "../../aave/domain/aave-risk-snapshot.js";
