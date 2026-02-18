/**
 * AI Agents — Barrel Export
 *
 * Bounded context: Aave / AI Agents
 *
 * Re-exports the AI risk agent, black swan detector, and the
 * Aave-specific intelligent agent ONLY.
 *
 * Uniswap and Lido intelligent agents have been moved to their
 * respective protocol bounded contexts to enforce DDD isolation:
 *   - protocols/uniswap/ai-agents/uniswap-intelligent-agent.ts
 *   - protocols/lido/ai-agents/lido-intelligent-agent.ts
 */

export {
  AIRiskAgent,
  type RiskSnapshot,
  type AgentEvaluationResult,
} from "./ai-risk-agent.js";

export {
  detectBlackSwan,
  type BlackSwanSnapshot,
} from "./ai-black-swan-detector.js";

// ── Aave-specific intelligent agent ──────────────────────────────────
//
// Only the Aave decision function belongs in this bounded context.
// Other protocols have their own isolated ai-agents/ directories.

export { decideAaveAction } from "./aave-intelligent-agent.js";
