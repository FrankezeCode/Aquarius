export type CopilotProtocol = "aave";
export type CopilotChain = "ethereum" | "polygon";

export interface CopilotConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotChatRequest {
  protocol: CopilotProtocol;
  chain: CopilotChain;
  walletAddress?: string;
  question: string;
  conversation?: CopilotConversationTurn[];
}

export interface CopilotDeterministicContext {
  protocol: CopilotProtocol;
  chain: CopilotChain;
  contextTimestamp: number;
  protocolHealth?: {
    score: number;
    category: "stable" | "watch" | "high_risk";
    confidence: number;
    reasoning: string;
    regime?: "normal" | "elevated" | "stressed";
    dominantRisk?: string;
  };
  userRisk?: {
    score: number;
    category: "stable" | "watch" | "high_risk";
    confidence: number;
    reasoning: string;
    healthFactor: number;
    liquidationDistancePct: number;
    healthFactorDirection: "up" | "down" | "neutral";
    mostExposedAsset: string;
    agentRecommendation: string;
    regime?: "normal" | "elevated" | "stressed";
    dominantRisk?: string;
  };
  escalation?: {
    stage: "info" | "confirm" | "invalidate";
    actionRequired: "none" | "protect" | "escalate";
    accumulator: number;
    transitionReason: string;
    stageStability?: "stable" | "transitioning" | "escalating";
    velocity?: number;
  };
  positionSummary?: {
    totalPositions: number;
    positionsAtRisk: number;
    avgHealthFactor: number;
  };
  missingData: string[];
}

export interface CopilotAdvisoryResponse {
  mode: "informational";
  answer: string;
  whatItMeans: string;
  recommendedActions: string[];
  confidence: number;
  limits: string[];
  disclaimer: string;
  contextTimestamp: number;
  schemaVersion: "v1";
  toolRouter: {
    available: boolean;
    mode: "disabled_option_a";
  };
  intentEnvelope: {
    available: boolean;
    mode: "disabled_option_a";
  };
  fallbackUsed?: boolean;
}

