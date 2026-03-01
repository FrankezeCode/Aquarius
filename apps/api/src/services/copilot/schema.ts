import type {
  CopilotAdvisoryResponse,
  CopilotChain,
  CopilotChatRequest,
  CopilotConversationTurn,
  CopilotProtocol,
} from "./types.js";

const MAX_QUESTION_LENGTH = 600;
const MAX_CONVERSATION_TURNS = 8;
const MAX_TURN_CONTENT_LENGTH = 400;

const VALID_PROTOCOLS: readonly CopilotProtocol[] = ["aave"];
const VALID_CHAINS: readonly CopilotChain[] = ["ethereum", "polygon"];

function isRole(value: string): value is CopilotConversationTurn["role"] {
  return value === "user" || value === "assistant";
}

export function parseCopilotChatRequest(input: unknown): CopilotChatRequest {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;

  const protocol = String(body.protocol ?? "").toLowerCase() as CopilotProtocol;
  if (!VALID_PROTOCOLS.includes(protocol)) {
    throw new Error(`Unsupported protocol "${String(body.protocol ?? "")}".`);
  }

  const chain = String(body.chain ?? "").toLowerCase() as CopilotChain;
  if (!VALID_CHAINS.includes(chain)) {
    throw new Error(`Unsupported chain "${String(body.chain ?? "")}".`);
  }

  const question = String(body.question ?? "").trim();
  if (!question) {
    throw new Error("Question is required.");
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new Error(`Question exceeds ${MAX_QUESTION_LENGTH} characters.`);
  }

  const walletAddress =
    typeof body.walletAddress === "string" ? body.walletAddress.trim() : undefined;

  const rawConversation = Array.isArray(body.conversation) ? body.conversation : [];
  if (rawConversation.length > MAX_CONVERSATION_TURNS) {
    throw new Error(`Conversation exceeds ${MAX_CONVERSATION_TURNS} turns.`);
  }

  const conversation: CopilotConversationTurn[] = rawConversation.map((turn, index) => {
    if (!turn || typeof turn !== "object") {
      throw new Error(`Conversation turn ${index + 1} must be an object.`);
    }
    const t = turn as Record<string, unknown>;
    const role = String(t.role ?? "");
    const content = String(t.content ?? "").trim();
    if (!isRole(role)) {
      throw new Error(`Conversation turn ${index + 1} has invalid role.`);
    }
    if (!content) {
      throw new Error(`Conversation turn ${index + 1} has empty content.`);
    }
    if (content.length > MAX_TURN_CONTENT_LENGTH) {
      throw new Error(
        `Conversation turn ${index + 1} exceeds ${MAX_TURN_CONTENT_LENGTH} characters.`
      );
    }
    return { role, content };
  });

  return {
    protocol,
    chain,
    walletAddress: walletAddress || undefined,
    question,
    conversation,
  };
}

export function parseCopilotAdvisoryResponse(input: unknown): Omit<
  CopilotAdvisoryResponse,
  "contextTimestamp" | "schemaVersion" | "toolRouter" | "intentEnvelope" | "mode"
> {
  if (!input || typeof input !== "object") {
    throw new Error("LLM response is not an object.");
  }
  const payload = input as Record<string, unknown>;
  const answer = String(payload.answer ?? "").trim();
  const whatItMeans = String(payload.whatItMeans ?? "").trim();
  const confidence = Number(payload.confidence ?? NaN);

  if (!answer) throw new Error("LLM response missing answer.");
  if (!whatItMeans) throw new Error("LLM response missing whatItMeans.");
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error("LLM response confidence must be between 0 and 1.");
  }

  const actions = Array.isArray(payload.recommendedActions)
    ? payload.recommendedActions
        .map((a) => String(a ?? "").trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const limits = Array.isArray(payload.limits)
    ? payload.limits
        .map((a) => String(a ?? "").trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const disclaimer = String(payload.disclaimer ?? "").trim();
  if (!disclaimer) {
    throw new Error("LLM response missing disclaimer.");
  }

  return {
    answer,
    whatItMeans,
    recommendedActions: actions,
    confidence,
    limits,
    disclaimer,
    fallbackUsed: false,
  };
}

