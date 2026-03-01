import type { AaveActiveChain } from "../../routes/v1/aave-risk/chain.js";
import type { EnrollmentStorePort } from "./store.port.js";
import type { AgentEnrollmentRecord } from "./types.js";

function buildKey(walletAddress: string, chain: AaveActiveChain): string {
  return `${walletAddress.toLowerCase()}:${chain}`;
}

export class InMemoryEnrollmentStore implements EnrollmentStorePort {
  private readonly records = new Map<string, AgentEnrollmentRecord>();

  async upsert(record: AgentEnrollmentRecord): Promise<AgentEnrollmentRecord> {
    const key = buildKey(record.walletAddress, record.chain);
    this.records.set(key, record);
    return record;
  }

  async getByWalletAndChain(
    walletAddress: string,
    chain: AaveActiveChain
  ): Promise<AgentEnrollmentRecord | null> {
    const key = buildKey(walletAddress, chain);
    return this.records.get(key) ?? null;
  }
}

