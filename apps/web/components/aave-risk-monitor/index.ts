/**
 * Aave Risk Monitor Components
 *
 * All components for the Aave Risk Monitor page.
 * Each component maps to a specific section in the page design.
 */

// Section 1 — Protocol Status (Vision)
export {
  ProtocolStatusBadge,
  type ProtocolStatus,
} from "./protocol-status-badge";

// Section 2 — Risk Progression Bar (selvä scoring visualization)
export {
  RiskProgressionBar,
  type RiskProgression,
} from "./risk-progression-bar";

// Section 3 — Risk Factors (Trust without cognitive load)
export {
  RiskFactorCards,
  type RiskFactor,
} from "./risk-factor-cards";

// Section 4 — Intelligence Layers (CRE orchestration)
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

// Developer Footer
export { DeveloperFooter } from "./developer-footer";
