import type { AaveActiveChain } from "../../routes/v1/aave-risk/chain.js";
import type { EnrollmentStorePort } from "./store.port.js";
import { InMemoryEnrollmentStore } from "./in-memory-store.js";
import type {
  AgentEnrollmentRecord,
  PolicyBindingStatus,
  UpsertAgentEnrollmentInput,
  ValidateChannelsInput,
  ValidateChannelsResult,
} from "./types.js";

export class AgentEnrollmentService {
  constructor(
    private readonly store: EnrollmentStorePort = new InMemoryEnrollmentStore()
  ) {}

  validateChannels(input: ValidateChannelsInput): ValidateChannelsResult {
    const errors: string[] = [];
    const telegram = input.telegram?.trim();
    const webhook = input.webhook?.trim();

    if (!telegram) {
      errors.push("telegram is required.");
    }

    if (webhook) {
      try {
        const url = new URL(webhook);
        if (url.protocol !== "https:" && url.protocol !== "http:") {
          errors.push("webhook must use http or https.");
        }
      } catch {
        errors.push("webhook must be a valid URL.");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      normalized: {
        telegram: telegram ? telegram.replace(/^@/, "@") : undefined,
        webhook: webhook || undefined,
      },
    };
  }

  async createOrUpdateEnrollment(
    input: UpsertAgentEnrollmentInput
  ): Promise<AgentEnrollmentRecord> {
    const channelsValidation = this.validateChannels(input.channels);
    if (!channelsValidation.valid) {
      throw new Error(channelsValidation.errors.join(" "));
    }

    const now = Date.now();
    const existing = await this.store.getByWalletAndChain(
      input.walletAddress,
      input.chain
    );
    const createdAt = existing?.createdAt ?? now;

    const status =
      process.env.PHASE_B_POLICY_BINDING === "1"
        ? (existing?.status ?? "inactive")
        : "active";

    const record: AgentEnrollmentRecord = {
      walletAddress: input.walletAddress,
      chain: input.chain,
      mode: input.mode,
      channels: channelsValidation.normalized,
      displayName: input.displayName,
      status,
      policyBindingStatus: existing?.policyBindingStatus ?? "pending_onchain",
      policyBindingRef: existing?.policyBindingRef ?? null,
      bindingChainId: existing?.bindingChainId ?? null,
      bindingError: existing?.bindingError ?? null,
      lastBindingAttemptAt: existing?.lastBindingAttemptAt ?? null,
      lastBindingIdempotencyKey: existing?.lastBindingIdempotencyKey ?? null,
      deactivationTxRef: existing?.deactivationTxRef ?? null,
      deactivatedAt: existing?.deactivatedAt ?? null,
      deactivationError: existing?.deactivationError ?? null,
      lastDeactivationAttemptAt: existing?.lastDeactivationAttemptAt ?? null,
      createdAt,
      updatedAt: now,
    };

    return this.store.upsert(record);
  }

  async getEnrollment(
    walletAddress: string,
    chain: AaveActiveChain
  ): Promise<AgentEnrollmentRecord | null> {
    return this.store.getByWalletAndChain(walletAddress, chain);
  }

  async startBindingIntent(input: {
    walletAddress: string;
    chain: AaveActiveChain;
    chainId: number;
    idempotencyKey: string;
    enrollmentDraft?: Omit<UpsertAgentEnrollmentInput, "walletAddress" | "chain">;
  }): Promise<AgentEnrollmentRecord> {
    let existing = await this.store.getByWalletAndChain(
      input.walletAddress,
      input.chain
    );
    if (!existing && input.enrollmentDraft) {
      existing = await this.createOrUpdateEnrollment({
        walletAddress: input.walletAddress,
        chain: input.chain,
        mode: input.enrollmentDraft.mode,
        channels: input.enrollmentDraft.channels,
        displayName: input.enrollmentDraft.displayName,
      });
    }
    if (!existing) {
      throw new Error(
        "Enrollment not found for wallet and chain. Provide enrollmentDraft for first-time bind."
      );
    }

    const isIdempotentReplay =
      existing.lastBindingIdempotencyKey === input.idempotencyKey &&
      (existing.policyBindingStatus === "signing_requested" ||
        existing.policyBindingStatus === "pending_tx" ||
        existing.policyBindingStatus === "bound_onchain");
    if (isIdempotentReplay) {
      return existing;
    }

    const now = Date.now();
    const next: AgentEnrollmentRecord = {
      ...existing,
      status: "inactive",
      bindingChainId: input.chainId,
      bindingError: null,
      policyBindingStatus: "signing_requested",
      lastBindingAttemptAt: now,
      lastBindingIdempotencyKey: input.idempotencyKey,
      updatedAt: now,
    };
    return this.store.upsert(next);
  }

  async confirmBinding(input: {
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
  }): Promise<AgentEnrollmentRecord> {
    const existing = await this.store.getByWalletAndChain(
      input.walletAddress,
      input.chain
    );
    if (!existing) {
      throw new Error("Enrollment not found for wallet and chain.");
    }

    const now = Date.now();
    const finalStatus: PolicyBindingStatus = input.error
      ? "bind_failed"
      : input.finalStatus ?? "bound_onchain";
    const next: AgentEnrollmentRecord = {
      ...existing,
      status: finalStatus === "bound_onchain" ? "active" : existing.status,
      bindingChainId: input.chainId,
      policyBindingStatus: finalStatus,
      policyBindingRef: input.txHash ?? existing.policyBindingRef,
      bindingError: input.error?.trim() || null,
      lastBindingAttemptAt: now,
      lastBindingIdempotencyKey: input.idempotencyKey,
      updatedAt: now,
    };
    return this.store.upsert(next);
  }

  async startDeactivationIntent(input: {
    walletAddress: string;
    chain: AaveActiveChain;
    chainId: number;
    idempotencyKey: string;
  }): Promise<AgentEnrollmentRecord> {
    const existing = await this.store.getByWalletAndChain(
      input.walletAddress,
      input.chain
    );
    if (!existing) {
      throw new Error("Enrollment not found for wallet and chain.");
    }
    const now = Date.now();
    const next: AgentEnrollmentRecord = {
      ...existing,
      bindingChainId: input.chainId,
      deactivationError: null,
      lastDeactivationAttemptAt: now,
      lastBindingIdempotencyKey: input.idempotencyKey,
      updatedAt: now,
    };
    return this.store.upsert(next);
  }

  async confirmDeactivation(input: {
    walletAddress: string;
    chain: AaveActiveChain;
    chainId: number;
    idempotencyKey: string;
    txHash?: string;
    error?: string;
  }): Promise<AgentEnrollmentRecord> {
    const existing = await this.store.getByWalletAndChain(
      input.walletAddress,
      input.chain
    );
    if (!existing) {
      throw new Error("Enrollment not found for wallet and chain.");
    }
    const now = Date.now();
    const next: AgentEnrollmentRecord = {
      ...existing,
      status: input.error ? existing.status : "inactive",
      bindingChainId: input.chainId,
      deactivationTxRef: input.txHash ?? existing.deactivationTxRef,
      deactivatedAt: input.error ? existing.deactivatedAt : now,
      deactivationError: input.error?.trim() || null,
      lastDeactivationAttemptAt: now,
      lastBindingIdempotencyKey: input.idempotencyKey,
      updatedAt: now,
    };
    return this.store.upsert(next);
  }
}

