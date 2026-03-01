/**
 * Aave Risk Monitor Components
 *
 * All components for the Aave Risk Monitor page.
 * Each component maps to a specific section in the page design.
 */

// Section 1 — Protocol Status (Vision) — kept for backward compat, removed from page
export {
  ProtocolStatusBadge,
  type ProtocolStatus,
} from "./protocol-status-badge";

// Section 2 — Risk Progression Bar (SELVA state machine)
export {
  RiskProgressionBar,
  type RiskProgression,
} from "./risk-progression-bar";

// Section 3 — Risk Factors (Trust without cognitive load)
export {
  RiskFactorCards,
  type RiskFactor,
} from "./risk-factor-cards";

// Section 4 — Intelligence Layers (CRE orchestration, behind DevMode toggle)
export {
  IntelligenceLayers,
  type LayerData,
} from "./intelligence-layers";

// Section 5 — Live Agent Action Feed (Reality surface)
export {
  LiveRiskEventFeed,
  type RiskEvent,
} from "./live-risk-event-feed";

// Section 6a — Connect Wallet CTA (Wayfinding)
export { ConnectWalletCTA } from "./connect-wallet-cta";

// Section 6b — Position Risk Status (Personal early warning)
export {
  PositionRiskStatus,
  type PositionRiskLevel,
  type PositionMetrics,
} from "./position-risk-status";

// Section 7 — Enable Alerts CTA (Peak-End Rule)
export { EnableAlertsCTA } from "./enable-alerts-cta";
export { AgentEnrollmentModal } from "./agent-enrollment-modal";

// Health Score Card
export {
  HealthScoreCard,
  type HealthScoreCardProps,
  type HealthCategory,
} from "./health-score-card";

// Actionable Metric Card
export {
  ActionableMetricCard,
  type ActionableMetric,
} from "./actionable-metric-card";

// Advanced Risk Metrics
export { AdvancedRiskMetrics } from "./advanced-risk-metrics";

// Stress Simulation
export { StressSimulation } from "./stress-simulation";

// Metric Insights Guide (Actionable Insights)
export { MetricInsightsGuide, MetricInsightsTrigger, MetricInsightsPanel } from "./metric-insights-guide";

// User Position Card (unified position view)
export { UserPositionCard, type UserPositionCardProps } from "./user-position-card";

// Risk Co-Pilot (informational mode)
export { RiskCopilotPanel } from "./risk-copilot-panel";
export { FloatingRiskCopilot } from "./floating-risk-copilot";

// Developer Footer
export { DeveloperFooter } from "./developer-footer";
