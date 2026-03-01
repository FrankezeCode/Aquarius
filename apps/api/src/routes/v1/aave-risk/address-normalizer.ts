import { getAddress } from "viem";

/**
 * Normalize an Ethereum address for API boundary handling.
 *
 * Accepts lower/mixed-case hex input and returns a checksummed address.
 * Returns null when the input is not a valid 20-byte hex address.
 */
export function normalizeEthereumAddress(input: string | undefined): string | null {
  if (!input) return null;
  try {
    // Lowercasing first avoids rejecting valid mixed-case non-checksummed inputs.
    return getAddress(input.toLowerCase());
  } catch {
    return null;
  }
}
