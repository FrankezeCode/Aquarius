/**
 * Bridge @solana/kit instructions → @solana/web3.js for simulateTransaction.
 */

import {
  AccountRole,
  isSignerRole,
  isWritableRole,
} from "@solana/kit";
import {
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

type KitInstruction = {
  programAddress: string;
  accounts: ReadonlyArray<{
    address: string;
    role: AccountRole;
  }>;
  data: Uint8Array;
};

export function kitInstructionToWeb3(ix: KitInstruction): TransactionInstruction {
  const programId = new PublicKey(ix.programAddress);
  const keys = ix.accounts.map((a) => ({
    pubkey: new PublicKey(a.address),
    isSigner: isSignerRole(a.role),
    isWritable: isWritableRole(a.role),
  }));
  return new TransactionInstruction({
    programId,
    keys,
    data: Buffer.from(ix.data),
  });
}

export function kitInstructionsToWeb3(
  ixs: readonly KitInstruction[]
): TransactionInstruction[] {
  return ixs.map(kitInstructionToWeb3);
}
