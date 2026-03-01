import type { AaveActiveChain } from "../../routes/v1/aave-risk/chain.js";
import type { AgentEnrollmentRecord } from "./types.js";

export interface EnrollmentStorePort {
  upsert(
    record: AgentEnrollmentRecord
  ): Promise<AgentEnrollmentRecord>;
  getByWalletAndChain(
    walletAddress: string,
    chain: AaveActiveChain
  ): Promise<AgentEnrollmentRecord | null>;
}

