import { createHash } from "node:crypto";
import { stableStringify } from "./canonical-json.js";

/** 32-byte commitment as 0x-prefixed hex (SHA-256 of stable JSON). */
export function sha256Commitment(payload: unknown): `0x${string}` {
  const body = stableStringify(payload);
  const hash = createHash("sha256").update(body, "utf8").digest("hex");
  return `0x${hash}`;
}
