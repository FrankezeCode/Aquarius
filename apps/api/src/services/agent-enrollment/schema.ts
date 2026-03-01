import {
  isAaveActiveChain,
  resolveAaveActiveChain,
  type AaveActiveChain,
} from "../../routes/v1/aave-risk/chain.js";
import type {
  AgentEnrollmentMode,
  PolicyBindingStatus,
  UpsertAgentEnrollmentInput,
  ValidateChannelsInput,
} from "./types.js";

const VALID_MODES: readonly AgentEnrollmentMode[] = [
  "alert_only",
  "mitigate_agent",
  "buffer_vault",
];

function parseOptionalText(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseChain(input: unknown): AaveActiveChain {
  const chain = typeof input === "string" ? input.toLowerCase() : undefined;
  if (!isAaveActiveChain(chain)) {
    throw new Error(`Unsupported chain "${String(input ?? "")}".`);
  }
  return resolveAaveActiveChain(chain);
}

export function parseMode(input: unknown): AgentEnrollmentMode {
  const mode = typeof input === "string" ? input.toLowerCase() : "";
  if (!VALID_MODES.includes(mode as AgentEnrollmentMode)) {
    throw new Error(`Unsupported mode "${String(input ?? "")}".`);
  }
  return mode as AgentEnrollmentMode;
}

export function parseValidateChannelsInput(
  input: unknown
): ValidateChannelsInput {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  return {
    telegram: parseOptionalText(body.telegram),
    webhook: parseOptionalText(body.webhook),
  };
}

export function parseEnrollmentCreateBody(input: unknown): Omit<
  UpsertAgentEnrollmentInput,
  "walletAddress" | "chain"
> {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  const mode = parseMode(body.mode);
  const telegram = parseOptionalText(body.telegram);
  const webhook = parseOptionalText(body.webhook);
  const displayName = parseOptionalText(body.displayName);
  return {
    mode,
    channels: { telegram, webhook },
    displayName,
  };
}

function parseRequiredText(input: unknown, field: string): string {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return input.trim();
}

function parseRequiredNumber(input: unknown, field: string): number {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    throw new Error(`${field} must be a finite number.`);
  }
  return input;
}

function parseOptionalFinalStatus(input: unknown): Extract<
  PolicyBindingStatus,
  "pending_tx" | "bound_onchain" | "bind_failed"
> | undefined {
  if (input == null) return undefined;
  if (typeof input !== "string") {
    throw new Error("finalStatus must be a string when provided.");
  }
  const normalized = input.toLowerCase();
  if (
    normalized !== "pending_tx" &&
    normalized !== "bound_onchain" &&
    normalized !== "bind_failed"
  ) {
    throw new Error(`Unsupported finalStatus "${input}".`);
  }
  return normalized as Extract<
    PolicyBindingStatus,
    "pending_tx" | "bound_onchain" | "bind_failed"
  >;
}

export interface BindIntentBody {
  walletAddress: string;
  chain: AaveActiveChain;
  chainId: number;
  idempotencyKey: string;
  mode?: AgentEnrollmentMode;
  telegram?: string;
  webhook?: string;
  displayName?: string;
}

export function parseBindIntentBody(input: unknown): BindIntentBody {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  return {
    walletAddress: parseRequiredText(body.walletAddress, "walletAddress"),
    chain: parseChain(body.chain),
    chainId: parseRequiredNumber(body.chainId, "chainId"),
    idempotencyKey: parseRequiredText(body.idempotencyKey, "idempotencyKey"),
    mode:
      typeof body.mode === "string"
        ? parseMode(body.mode)
        : undefined,
    telegram: parseOptionalText(body.telegram),
    webhook: parseOptionalText(body.webhook),
    displayName: parseOptionalText(body.displayName),
  };
}

export interface ConfirmBindBody {
  walletAddress: string;
  chain: AaveActiveChain;
  chainId: number;
  idempotencyKey: string;
  txHash?: string;
  error?: string;
  finalStatus?: Extract<
    PolicyBindingStatus,
    "pending_tx" | "bound_onchain" | "bind_failed"
  >;
}

export function parseConfirmBindBody(input: unknown): ConfirmBindBody {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  return {
    walletAddress: parseRequiredText(body.walletAddress, "walletAddress"),
    chain: parseChain(body.chain),
    chainId: parseRequiredNumber(body.chainId, "chainId"),
    idempotencyKey: parseRequiredText(body.idempotencyKey, "idempotencyKey"),
    txHash: parseOptionalText(body.txHash),
    error: parseOptionalText(body.error),
    finalStatus: parseOptionalFinalStatus(body.finalStatus),
  };
}

export interface DeactivateIntentBody {
  walletAddress: string;
  chain: AaveActiveChain;
  chainId: number;
  idempotencyKey: string;
}

export function parseDeactivateIntentBody(input: unknown): DeactivateIntentBody {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  return {
    walletAddress: parseRequiredText(body.walletAddress, "walletAddress"),
    chain: parseChain(body.chain),
    chainId: parseRequiredNumber(body.chainId, "chainId"),
    idempotencyKey: parseRequiredText(body.idempotencyKey, "idempotencyKey"),
  };
}

export interface ConfirmDeactivateBody {
  walletAddress: string;
  chain: AaveActiveChain;
  chainId: number;
  idempotencyKey: string;
  txHash?: string;
  error?: string;
}

export function parseConfirmDeactivateBody(input: unknown): ConfirmDeactivateBody {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  return {
    walletAddress: parseRequiredText(body.walletAddress, "walletAddress"),
    chain: parseChain(body.chain),
    chainId: parseRequiredNumber(body.chainId, "chainId"),
    idempotencyKey: parseRequiredText(body.idempotencyKey, "idempotencyKey"),
    txHash: parseOptionalText(body.txHash),
    error: parseOptionalText(body.error),
  };
}

export interface BufferVaultDepositDemoBody {
  walletAddress: string;
  chain: AaveActiveChain;
  asset: string;
  amount: number;
}

export function parseBufferVaultDepositDemoBody(
  input: unknown
): BufferVaultDepositDemoBody {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  const asset = parseRequiredText(body.asset, "asset").toUpperCase();
  const amount = parseRequiredNumber(body.amount, "amount");
  if (amount <= 0) {
    throw new Error("amount must be greater than 0.");
  }
  return {
    walletAddress: parseRequiredText(body.walletAddress, "walletAddress"),
    chain: parseChain(body.chain),
    asset,
    amount,
  };
}

