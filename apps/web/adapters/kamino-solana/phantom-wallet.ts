/**
 * Phantom injected wallet — bounded to `apps/web/adapters/kamino-solana` (SoC).
 */

export class PhantomNotInstalledError extends Error {
  constructor() {
    super("Phantom is not installed or unavailable in this browser.");
    this.name = "PhantomNotInstalledError";
  }
}

export class PhantomRejectedError extends Error {
  constructor() {
    super("Wallet connection was cancelled.");
    this.name = "PhantomRejectedError";
  }
}

type PhantomPublicKeyLike = {
  toBase58(): string;
};

interface PhantomProviderLike {
  readonly isPhantom?: boolean;
  connect(): Promise<{ publicKey: PhantomPublicKeyLike }>;
  disconnect(): Promise<void>;
}

function getPhantom(): PhantomProviderLike | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    solana?: PhantomProviderLike & { isPhantom?: boolean };
    phantom?: { solana?: PhantomProviderLike };
  };
  const p = w.solana?.isPhantom ? w.solana : w.phantom?.solana;
  return p?.isPhantom ? p : undefined;
}

function publicKeyToAddress(pk: PhantomPublicKeyLike): string {
  try {
    return pk.toBase58();
  } catch {
    return "";
  }
}

export function isPhantomBrowserWalletAvailable(): boolean {
  return Boolean(getPhantom());
}

export async function connectPhantomSolanaWallet(): Promise<string> {
  const phantom = getPhantom();
  if (!phantom) throw new PhantomNotInstalledError();
  try {
    const { publicKey } = await phantom.connect();
    const addr = publicKeyToAddress(publicKey);
    if (!addr) throw new Error("Empty public key from Phantom.");
    return addr;
  } catch (e) {
    if (e instanceof PhantomNotInstalledError) throw e;
    const msg =
      e instanceof Error ? e.message : typeof e === "string" ? e : "";
    if (/user reject|reject|cancel|denied/i.test(msg)) {
      throw new PhantomRejectedError();
    }
    throw e;
  }
}

export async function disconnectPhantomSolanaWallet(): Promise<void> {
  const phantom = getPhantom();
  if (!phantom) return;
  await phantom.disconnect();
}
