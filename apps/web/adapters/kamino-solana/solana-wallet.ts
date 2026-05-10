/**
 * Solana injected-wallet adapter (Phantom + Backpack).
 *
 * Bounded to `apps/web/adapters/kamino-solana` (SoC enforced by
 * `apps/web/scripts/check-kamino-solana-adapter.mjs`). Intentionally
 * zero `@solana/*` deps — direct injected provider detection keeps the
 * web bundle small and avoids the wallet-adapter SDK's heavy churn.
 *
 * For signed flows (build + simulate on the server, broadcast via the
 * wallet's own RPC), see Step 8 in the production rollout playbook —
 * this module exposes the connect/identity surface only; transaction
 * submission is the wallet's responsibility.
 */

export type SolanaWalletKind = "phantom" | "backpack";

const WALLET_KINDS: readonly SolanaWalletKind[] = ["phantom", "backpack"] as const;

const WALLET_LABELS: Record<SolanaWalletKind, string> = {
  phantom: "Phantom",
  backpack: "Backpack",
};

export function getSolanaWalletLabel(kind: SolanaWalletKind): string {
  return WALLET_LABELS[kind];
}

export function isSolanaWalletKind(value: unknown): value is SolanaWalletKind {
  return typeof value === "string" && (WALLET_KINDS as readonly string[]).includes(value);
}

export class SolanaWalletNotInstalledError extends Error {
  readonly kind: SolanaWalletKind;
  constructor(kind: SolanaWalletKind) {
    super(`${WALLET_LABELS[kind]} is not installed or unavailable in this browser.`);
    this.name = "SolanaWalletNotInstalledError";
    this.kind = kind;
  }
}

export class SolanaWalletRejectedError extends Error {
  constructor() {
    super("Wallet connection was cancelled.");
    this.name = "SolanaWalletRejectedError";
  }
}

/**
 * Thrown when `connect({ onlyIfTrusted: true })` fails because the user
 * has not previously authorized this site. The caller should treat this
 * as a non-error (silent reconnect simply doesn't apply) rather than
 * surfacing it to the user.
 */
export class SolanaWalletNotTrustedError extends Error {
  constructor() {
    super("Wallet has not previously trusted this site.");
    this.name = "SolanaWalletNotTrustedError";
  }
}

type PublicKeyLike = { toBase58(): string };

type WalletEventName = "connect" | "disconnect" | "accountChanged";
type WalletEventHandler = (...args: unknown[]) => void;

interface InjectedSolanaProvider {
  readonly isPhantom?: boolean;
  readonly isBackpack?: boolean;
  publicKey?: PublicKeyLike | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKeyLike }>;
  disconnect(): Promise<void> | void;
  on?(event: WalletEventName, handler: WalletEventHandler): void;
  off?(event: WalletEventName, handler: WalletEventHandler): void;
  removeListener?(event: WalletEventName, handler: WalletEventHandler): void;
}

declare global {
  interface Window {
    solana?: InjectedSolanaProvider;
    phantom?: { solana?: InjectedSolanaProvider };
    backpack?: InjectedSolanaProvider;
    xnft?: { solana?: InjectedSolanaProvider };
  }
}

function getProvider(kind: SolanaWalletKind): InjectedSolanaProvider | undefined {
  if (typeof window === "undefined") return undefined;
  if (kind === "phantom") {
    const fromPhantom = window.phantom?.solana;
    if (fromPhantom?.isPhantom) return fromPhantom;
    const fromSolana = window.solana;
    if (fromSolana?.isPhantom && !fromSolana.isBackpack) return fromSolana;
    return undefined;
  }
  // Backpack registers in several places depending on version.
  const direct = window.backpack;
  if (direct?.isBackpack) return direct;
  const xnftSol = window.xnft?.solana;
  if (xnftSol?.isBackpack) return xnftSol;
  const sol = window.solana;
  if (sol?.isBackpack) return sol;
  return undefined;
}

export function detectInstalledSolanaWallets(): SolanaWalletKind[] {
  const installed: SolanaWalletKind[] = [];
  for (const kind of WALLET_KINDS) {
    if (getProvider(kind)) installed.push(kind);
  }
  return installed;
}

function publicKeyToAddress(pk: PublicKeyLike | null | undefined): string {
  if (!pk) return "";
  try {
    return pk.toBase58();
  } catch {
    return "";
  }
}

export interface ConnectedSolanaWallet {
  readonly address: string;
  readonly kind: SolanaWalletKind;
}

export async function connectSolanaWallet(
  kind: SolanaWalletKind,
  opts: { onlyIfTrusted?: boolean } = {},
): Promise<ConnectedSolanaWallet> {
  const provider = getProvider(kind);
  if (!provider) throw new SolanaWalletNotInstalledError(kind);
  try {
    const { publicKey } = await provider.connect({ onlyIfTrusted: opts.onlyIfTrusted });
    const addr = publicKeyToAddress(publicKey);
    if (!addr) throw new Error(`Empty public key from ${WALLET_LABELS[kind]}.`);
    return { address: addr, kind };
  } catch (e) {
    if (e instanceof SolanaWalletNotInstalledError) throw e;
    const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "";
    if (
      opts.onlyIfTrusted &&
      /not trusted|not authorized|user has not|trust this app/i.test(msg)
    ) {
      throw new SolanaWalletNotTrustedError();
    }
    if (/user reject|reject|cancel|denied/i.test(msg)) {
      throw new SolanaWalletRejectedError();
    }
    throw e;
  }
}

export async function disconnectSolanaWallet(kind: SolanaWalletKind): Promise<void> {
  const provider = getProvider(kind);
  if (!provider) return;
  try {
    await provider.disconnect();
  } catch {
    // Disconnect noise from extensions is non-fatal.
  }
}

export interface SolanaWalletEventHandlers {
  /** Called with the new address (base58) or `null` if account was cleared. */
  onAccountChanged?: (address: string | null) => void;
  /** Called when the wallet emits a disconnect event (extension-driven). */
  onDisconnect?: () => void;
}

/**
 * Subscribe to live wallet events. Returns an unsubscribe function. Safe
 * to call before the provider injects (no-op + returns no-op cleanup).
 */
export function subscribeToSolanaWalletEvents(
  kind: SolanaWalletKind,
  handlers: SolanaWalletEventHandlers,
): () => void {
  const provider = getProvider(kind);
  if (!provider?.on) return () => {};

  const accountHandler: WalletEventHandler = (...args) => {
    const next = args[0] as PublicKeyLike | null | undefined;
    handlers.onAccountChanged?.(next ? publicKeyToAddress(next) : null);
  };
  const disconnectHandler: WalletEventHandler = () => {
    handlers.onDisconnect?.();
  };

  provider.on("accountChanged", accountHandler);
  provider.on("disconnect", disconnectHandler);

  return () => {
    const remove =
      provider.off?.bind(provider) ?? provider.removeListener?.bind(provider);
    remove?.("accountChanged", accountHandler);
    remove?.("disconnect", disconnectHandler);
  };
}
