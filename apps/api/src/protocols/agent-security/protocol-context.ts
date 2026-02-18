/**
 * Protocol Context — Re-export from Shared Kernel
 *
 * Bounded context: Agent Security / Domain
 *
 * Re-exports the shared ProtocolContext and SupportedProtocol types
 * from the shared kernel. The agent-security bounded context depends
 * on abstract shared types rather than defining its own.
 *
 * DDD role: Re-export (delegates to Shared Kernel).
 */

export type { SupportedProtocol, ProtocolContext } from "../shared/types/protocol-context.js";
