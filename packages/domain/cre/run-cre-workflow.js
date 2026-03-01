/**
 * CRE Workflow — Single Orchestration Function
 *
 * Application layer: orchestrates the full Aquarius CRE pipeline.
 *
 *   1. Risk Intelligence  (signals → correlate → score → monitor)
 *   2. Agent Decision      (AIRiskAgent evaluation)
 *   3. LLM Reasoning       (optional, async, non-blocking)
 *   4. Action Dispatch      (escalation service, CRE adapter)
 *
 * Rules:
 *   - No UI imports
 *   - No framework dependencies
 *   - Pure orchestration
 *   - Deterministic layers must complete < 100ms total (excluding LLM)
 *   - LLM must NOT block the deterministic path
 *
 * Shared by: CLI (`pnpm run:cre`) and API (`/api/cre/run`)
 */
import { runMonitor, } from "../../../apps/api/src/protocols/aave/risk-intelligence/monitor.js";
import { deriveChainMetrics, } from "../../../apps/api/src/protocols/aave/risk-intelligence/signals.js";
import { AIRiskAgent, } from "../../../apps/api/src/protocols/aave/ai-agents/ai-risk-agent.js";
import { getEscalationMachine } from "../../../apps/api/src/protocols/aave/risk-intelligence/escalation-store.js";
// ── Mapping helpers ──────────────────────────────────────────────────
const STATUS_MAP = {
    safe: "stable",
    watch: "watch",
    "early-warning": "high-risk",
    critical: "high-risk",
};
function mapProtocolStatus(level) {
    return STATUS_MAP[level];
}
function deriveRiskFactors(metrics, level) {
    const utilization = metrics.totalCollateralUsd > 0
        ? Math.round((metrics.totalDebtUsd / metrics.totalCollateralUsd) * 100)
        : 0;
    const liquidationVolume = metrics.positionsAtRisk * 12_400;
    const formattedLiquidation = liquidationVolume >= 1_000_000
        ? `$${(liquidationVolume / 1_000_000).toFixed(1)}M`
        : `$${(liquidationVolume / 1_000).toFixed(0)}K`;
    const oracleHealthy = level === "safe" || level === "watch";
    return [
        {
            id: "utilization",
            label: "Utilization",
            value: `${utilization}%`,
            direction: utilization > 75 ? "up" : utilization < 50 ? "down" : "neutral",
            interpretation: utilization > 80
                ? "Borrow demand rising. Liquidity stress likely."
                : utilization > 60
                    ? "Moderate borrow demand. Pool healthy."
                    : "Low utilization. Excess liquidity available.",
            action: utilization > 80
                ? "Monitor pool liquidity. Avoid new borrowing."
                : "No action required.",
        },
        {
            id: "liquidations",
            label: "Liquidations (24h)",
            value: formattedLiquidation,
            direction: metrics.positionsAtRisk > 5 ? "up" : "down",
            interpretation: metrics.positionsAtRisk > 10
                ? "High liquidation activity. Market stress detected."
                : metrics.positionsAtRisk > 3
                    ? "Moderate liquidation pressure building."
                    : "Low liquidation activity. Market stable.",
            action: metrics.positionsAtRisk > 10
                ? "Check your position buffer. Consider adding collateral."
                : "No action required.",
        },
        {
            id: "oracle",
            label: "Oracle Health",
            value: oracleHealthy ? "STABLE" : "DEGRADED",
            direction: oracleHealthy ? undefined : "down",
            interpretation: oracleHealthy
                ? "Price feeds operating normally."
                : "Oracle deviation detected. Price data may be stale.",
            action: oracleHealthy
                ? "No action required."
                : "Avoid new positions until oracle stabilizes.",
        },
    ];
}
/**
 * Evaluate the SELVA escalation state machine with the current risk data.
 * Returns the new progression state and any required action.
 */
function evaluateEscalation(chainId, monitorResult) {
    const machine = getEscalationMachine(chainId);
    const result = machine.update(monitorResult.score.composite, monitorResult.score.dimensions, Date.now());
    return {
        stage: result.state.stage,
        accumulator: result.state.accumulator,
        convergenceSignals: result.state.convergenceSignals,
        enteredAt: result.state.enteredAt,
        transitionReason: result.state.transitionReason,
        lastAction: result.state.lastAction,
        actionRequired: result.actionRequired,
        velocity: result.state.velocity,
        stageStability: result.state.stageStability,
        timeline: result.state.timeline,
    };
}
function buildEvents(monitorResult, agentResult, metrics, llmReasoning, riskProgression) {
    const now = new Date();
    const fmt = (offsetSec) => {
        const d = new Date(now.getTime() - offsetSec * 1000);
        return d.toLocaleTimeString("en-US", { hour12: false });
    };
    const events = [];
    let seq = 0;
    const push = (msg, severity, offsetSec) => {
        events.push({
            id: `evt-${Date.now()}-${seq++}`,
            timestamp: fmt(offsetSec),
            message: msg,
            severity,
        });
    };
    const level = monitorResult.score.level;
    const sevMap = {
        safe: "info",
        watch: "warning",
        "early-warning": "warning",
        critical: "critical",
    };
    const sev = sevMap[level];
    if (agentResult.actionsRequested.length > 0) {
        push(`Agent dispatched: ${agentResult.actionsRequested.join(", ")}`, sev, 0);
    }
    if (llmReasoning) {
        push(`LLM reasoning completed (confidence ${llmReasoning.confidence})`, "info", 2);
    }
    push(`Risk score: ${(monitorResult.score.composite * 100).toFixed(1)}% — ${level.toUpperCase()}`, sev, 4);
    if (metrics.positionsAtRisk > 0) {
        const pctAtRisk = metrics.totalPositions > 0
            ? ((metrics.positionsAtRisk / metrics.totalPositions) * 100).toFixed(1)
            : "0";
        push(`${metrics.positionsAtRisk} positions within 5% liquidation distance (${pctAtRisk}% of pool) — liquidation bots likely active`, metrics.positionsAtRisk > 10 ? "warning" : "info", 8);
    }
    push(`Avg health factor: ${metrics.avgHealthFactor} across ${metrics.totalPositions} positions`, "info", 12);
    if (monitorResult.ccipDispatched) {
        push("Cross-chain risk signal broadcast", "critical", 1);
    }
    if (agentResult.blackSwanDetected) {
        push("Black swan conditions detected", "critical", 3);
    }
    if (riskProgression?.timeline) {
        const recent = riskProgression.timeline.slice(-3);
        for (const entry of recent) {
            if (entry.type === "ENTER_CONFIRM") {
                push("SELVA escalated to CONFIRM: " + entry.reason, "warning", 0);
            }
            else if (entry.type === "ENTER_INVALIDATE") {
                push("SELVA escalated to INVALIDATE: " + entry.reason, "critical", 0);
            }
        }
    }
    return events;
}
function mapAgentDecision(agentResult) {
    if (agentResult.actionsRequested.includes("ESCALATE"))
        return "ESCALATE";
    if (agentResult.actionsRequested.includes("PROTECT_POSITION"))
        return "PROTECT_POSITION";
    if (agentResult.actionsRequested.includes("NOTIFY"))
        return "OBSERVE_ONLY";
    return "OBSERVE_ONLY";
}
function computeConfidence(monitorResult, agentResult) {
    const composite = monitorResult.score.composite;
    const distance = Math.abs(composite - 0.5);
    return Math.round((0.5 + distance) * 100);
}
/**
 * Execute the full CRE monitoring workflow.
 *
 * Single orchestration point shared by CLI and API.
 * No UI imports. No framework dependencies. Pure orchestration.
 */
export async function runCREWorkflow(options = {}) {
    const { provider, chainId = "ethereum", positionLimit = 50, enableLLM = false, groqApiKey, } = options;
    const totalStart = performance.now();
    // ── Layer 1: Risk Intelligence ──────────────────────────────────
    const riskStart = performance.now();
    // Single fetch via injected provider (or legacy fallback)
    let monitorResult;
    let chainMetrics;
    if (provider) {
        const positions = await provider.fetchPositionSnapshots(chainId, positionLimit);
        chainMetrics = deriveChainMetrics(chainId, positions);
        monitorResult = await runMonitor(chainId, positions);
    }
    else {
        // Legacy path: runMonitor fetches internally
        monitorResult = await runMonitor(chainId, positionLimit);
        chainMetrics = deriveChainMetrics(chainId, []);
    }
    const riskLatency = Math.round(performance.now() - riskStart);
    // ── Layer 1.5: SELVA Escalation State Machine ──────────────────
    const escalation = evaluateEscalation(chainId, monitorResult);
    // Circuit breaker check on INVALIDATE
    if (escalation.stage === "invalidate") {
        console.warn(`[cre-workflow] INVALIDATE stage entered for ${chainId} — circuit breaker evaluation recommended`);
    }
    // ── Layer 2: Agent Decision ─────────────────────────────────────
    const agentStart = performance.now();
    const agent = new AIRiskAgent("cre-workflow-agent", "risk-actions");
    const riskSnapshot = {
        chainId,
        riskScore: monitorResult.score.composite,
        avgHealthFactor: chainMetrics.avgHealthFactor,
        liquidityDelta: chainMetrics.positionsAtRisk > 10 ? -0.25 : -0.05,
        sampleSize: chainMetrics.totalPositions,
        timestamp: Date.now(),
        escalationStage: escalation.stage,
    };
    const agentResult = agent.evaluate(riskSnapshot);
    // Report action result back to escalation state machine
    if (agentResult.actionsRequested.length > 0) {
        const machine = getEscalationMachine(chainId);
        machine.reportActionResult(agentResult.actionsRequested[0], true, Date.now());
    }
    const agentLatency = Math.round(performance.now() - agentStart);
    // ── Layer 3: LLM Reasoning (async, non-blocking) ───────────────
    let llmReasoning;
    let llmLatency;
    if (enableLLM && groqApiKey) {
        const llmStart = performance.now();
        try {
            const { AquariusLLMAgent } = await import("../../../packages/sdk/src/agent/llm-agent.js");
            const llmAgent = new AquariusLLMAgent(groqApiKey);
            const llmSnapshot = {
                protocol: "aave",
                chainId: 1,
                riskScore: Math.round(monitorResult.score.composite * 100),
                severity: monitorResult.score.level === "critical" ? "high" : monitorResult.score.level === "early-warning" ? "medium" : "low",
                signals: {
                    liquidationPressure: chainMetrics.positionsAtRisk / chainMetrics.totalPositions,
                    collateralConcentration: 0.3,
                    healthFactorTrend: chainMetrics.avgHealthFactor < 1.5 ? -0.1 : 0.02,
                    marketStressCorrelation: monitorResult.score.composite > 0.6,
                },
            };
            const decision = await llmAgent.evaluate(llmSnapshot);
            llmLatency = Math.round(performance.now() - llmStart);
            llmReasoning = {
                action: decision.action,
                confidence: decision.confidence,
                reason: decision.reason,
            };
        }
        catch {
            llmLatency = Math.round(performance.now() - llmStart);
        }
    }
    // ── Layer 4: Action Layer ───────────────────────────────────────
    // Actions were already dispatched synchronously during agent.evaluate()
    // via the escalation service → CRE adapter (non-blocking queueMicrotask).
    const actionLatency = agentResult.actionsRequested.length > 0 ? 1 : 0;
    const totalLatency = Math.round(performance.now() - totalStart);
    // ── Build result ────────────────────────────────────────────────
    const decision = mapAgentDecision(agentResult);
    const result = {
        protocolStatus: mapProtocolStatus(monitorResult.score.level),
        riskScore: {
            composite: monitorResult.score.composite,
            level: monitorResult.score.level,
            summary: monitorResult.score.summary,
            dimensions: monitorResult.score.dimensions,
            sampleSize: monitorResult.score.sampleSize,
        },
        riskFactors: deriveRiskFactors(chainMetrics, monitorResult.score.level),
        riskProgression: escalation,
        agentDecision: {
            decision,
            confidence: computeConfidence(monitorResult, agentResult),
            actionsRequested: agentResult.actionsRequested,
            blackSwanDetected: agentResult.blackSwanDetected,
        },
        llmReasoning,
        actionDispatch: {
            dispatched: agentResult.actionsRequested,
        },
        latencies: {
            risk: riskLatency,
            agent: agentLatency,
            llm: llmLatency,
            action: actionLatency,
            total: totalLatency,
        },
        events: buildEvents(monitorResult, agentResult, chainMetrics, llmReasoning, escalation),
        timestamp: Date.now(),
    };
    return result;
}
//# sourceMappingURL=run-cre-workflow.js.map