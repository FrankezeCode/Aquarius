/**
 * Aquarius SDK — Public Entry Point
 *
 * Re-exports all SDK primitives:
 *   - Core client + provider
 *   - Protocol bounded contexts (aave, uniswap, lido)
 *   - Protocol adapter contract
 *   - Selva runtime (guardrails + strategy engine)
 */

// ── Core SDK primitives ──────────────────────────────────────────────
export { createClient, type AquariusClient, type AquariusClientConfig } from "./client.js";
export { type StreamKind, type StreamConfig } from "./streams.js";
export { type ChainId, type ProtocolEndpoint } from "./protocols.js";

// ── Provider ─────────────────────────────────────────────────────────
export { createProvider, type AquariusProvider, type AquariusProviderConfig } from "./provider.js";

// ── Protocol Bounded Contexts (DDD) ──────────────────────────────────
export * as aaveSelva from "./aave-selva/index.js";
export * as uniswapSelva from "./uniswap-selva/index.js";
export * as lidoSelva from "./lido-selva/index.js";

// ── Protocol Adapter Contract ────────────────────────────────────────
export type { ProtocolRiskAdapter } from "./protocols/adapter.js";

// ── LLM Risk Agent (Groq — OpenAI-compatible) ──────────────────────
export {
  type AgentAction,
  type AgentDecision,
  AgentDecisionSchema,
  AQUARIUS_SYSTEM_PROMPT,
  AquariusLLMAgent,
  AquariusGeminiAgent,
} from "./agent/index.js";

// ── Selva Runtime (Strategy Engine + Guardrails) ─────────────────────
export {
  // Contract types (runtime boundary)
  type ProtocolId,
  type RiskMetadata,
  type RiskSeverity,
  type EvaluatableRisk,
  // Errors
  SelvaPolicyViolation,
  SelvaExecutionBlocked,
  // Pluggable store
  type ExecutionStore,
  MemoryExecutionStore,
  // Guardrails
  RiskPolicy,
  type RiskPolicyConfig,
  ExecutionLimiter,
  SelvaStrategy,
} from "./runtime/index.js";
