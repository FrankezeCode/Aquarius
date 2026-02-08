/**
 * Aave Risk Monitor Components
 * 
 * All components for the Aave Risk Monitor page.
 * Each component maps to a specific section in the selvä-native design.
 */

// Section 1 — Protocol Status (Vision)
export {
  ProtocolStatusBadge,
  type ProtocolStatus,
} from "./protocol-status-badge";

// Section 2 — Risk Factors (Trust without cognitive load)
export {
  RiskFactorCards,
  type RiskFactor,
} from "./risk-factor-cards";

// Section 3 — Risk Progression Bar (Progressive Failure visualization)
export {
  RiskProgressionBar,
  type RiskProgression,
} from "./risk-progression-bar";

// Section 4 — Live Risk Event Feed (Reality surface)
export {
  LiveRiskEventFeed,
  type RiskEvent,
} from "./live-risk-event-feed";

// Section 5 — Connect Wallet CTA (Wayfinding)
export { ConnectWalletCTA } from "./connect-wallet-cta";

// Section 6 — Position Risk Status (Personal early warning)
export {
  PositionRiskStatus,
  type PositionRiskLevel,
  type PositionMetrics,
} from "./position-risk-status";

// Section 7 — Enable Alerts CTA (Peak-End Rule)
export { EnableAlertsCTA } from "./enable-alerts-cta";

// Developer Footer
export { DeveloperFooter } from "./developer-footer";
