/**
 * Agent Security — Barrel Export
 *
 * Bounded context: Agent Security
 *
 * Top-level barrel export for the multi-protocol agent security layer.
 * Re-exports protocol context (from shared kernel), protocol-specific
 * sub-modules, and protocol security adapters.
 *
 * The domain layer of agent-security depends only on abstract shared
 * interfaces (ProtocolSecurityAdapter, AgentIdentity). Protocol-specific
 * concrete logic lives in the adapters/ sub-directory.
 */

// ── Shared types (re-export from shared kernel) ──────────────────────

export {
  type SupportedProtocol,
  type ProtocolContext,
} from "./protocol-context.js";

// ── Aave ─────────────────────────────────────────────────────────────

export {
  type AaveAgent,
  type AaveAgentCapabilities,
  type AaveRiskSnapshot,
  validateAaveAgentExecution,
} from "./aave/index.js";

// ── Uniswap ──────────────────────────────────────────────────────────

export {
  type UniswapAgent,
  type UniswapAgentCapabilities,
  type UniswapRiskSnapshot,
  validateUniswapAgentExecution,
} from "./uniswap/index.js";

// ── Lido ─────────────────────────────────────────────────────────────

export {
  type LidoAgent,
  type LidoAgentCapabilities,
  type LidoRiskSnapshot,
  validateLidoAgentExecution,
} from "./lido/index.js";

// ── Protocol Security Adapters ───────────────────────────────────────

export {
  AaveSecurityAdapter,
  UniswapSecurityAdapter,
  LidoSecurityAdapter,
} from "./adapters/index.js";
