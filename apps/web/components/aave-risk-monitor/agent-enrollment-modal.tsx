"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  type AgentEnrollmentInput,
  type AgentEnrollmentMode,
} from "@/lib/use-agent-enrollment";
import { signPolicyIntent } from "@/lib/policy-intent";

interface AgentEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress?: string;
  chain: string;
  chainId: number;
  providerAvailable?: boolean;
  isWalletOnWrongChain?: boolean;
  walletError?: string | null;
  onSubmit?: (payload: AgentEnrollmentInput) => Promise<void>;
  onBound?: () => Promise<void> | void;
  onBufferVaultDeposit?: (payload: { asset: string; amount: number }) => Promise<void>;
}

const MODE_DETAILS: Record<
  AgentEnrollmentMode,
  { title: string; description: string }
> = {
  alert_only: {
    title: "Send Alerts only",
    description: "Passive monitoring via Telegram / Webhook",
  },
  mitigate_agent: {
    title: "Employ Agent",
    description: "Active intervention to help mitigate risk",
  },
  buffer_vault: {
    title: "Insure Position",
    description: "Buffer Vault allocation + yield generation",
  },
};

function maskAddress(value?: string): string {
  if (!value) return "Wallet not connected";
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function AgentEnrollmentModal({
  open,
  onOpenChange,
  walletAddress,
  chain,
  chainId,
  providerAvailable = true,
  isWalletOnWrongChain = false,
  walletError = null,
  onSubmit,
  onBound,
  onBufferVaultDeposit,
}: AgentEnrollmentModalProps) {
  const [step, setStep] = useState<"policy" | "vault" | "success">("policy");
  const [displayName, setDisplayName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [webhook, setWebhook] = useState("");
  const [mode, setMode] = useState<AgentEnrollmentMode>("alert_only");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bindingStatusText, setBindingStatusText] = useState("Idle");
  const [vaultAsset, setVaultAsset] = useState("USDC");
  const [vaultAmount, setVaultAmount] = useState("");
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [isInsuring, setIsInsuring] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) return;
    setStep("policy");
    setError(null);
    setVaultError(null);
    setVaultAmount("");
    setVaultAsset("USDC");
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      providerAvailable &&
      !isWalletOnWrongChain &&
      Boolean(walletAddress) &&
      Boolean(telegram.trim())
    );
  }, [isWalletOnWrongChain, providerAvailable, telegram, walletAddress]);

  async function submit() {
    if (!providerAvailable) {
      setError("MetaMask provider is unavailable. Install or enable MetaMask.");
      return;
    }
    if (!walletAddress) {
      setError("Connect wallet first to create an enrollment policy.");
      return;
    }
    if (isWalletOnWrongChain) {
      setError("Wallet network does not match the selected chain. Switch and retry.");
      return;
    }
    if (!telegram.trim()) {
      setError("Telegram username is required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setBindingStatusText("Preparing policy bind...");
    try {
      const payload: AgentEnrollmentInput = {
        walletAddress,
        chain,
        mode,
        displayName: displayName.trim() || undefined,
        telegram: telegram.trim() || undefined,
        webhook: webhook.trim() || undefined,
      };

      setBindingStatusText("Awaiting MetaMask signature...");
      const result = await signPolicyIntent({
        ...payload,
        chainId,
      });

      if (result.status === "pending_onchain") {
        if (!onSubmit) {
          throw new Error("Phase A fallback is unavailable in this build.");
        }
        setBindingStatusText("Saving enrollment in off-chain fallback mode...");
        await onSubmit(payload);
        setBindingStatusText("Saved off-chain (Phase A fallback).");
      } else {
        setBindingStatusText("Bound on Tenderly. Transaction submitted.");
      }
      await onBound?.();
      if (mode === "buffer_vault") {
        setStep("vault");
        setBindingStatusText(
          "Policy saved. Complete a demo insurance deposit to activate Buffer Vault policy."
        );
        return;
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBindingStatusText("Binding failed. Enrollment remains disabled until on-chain success.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="w-[min(92vw,52rem)] max-h-[85vh] overflow-y-auto border border-[#1d2330] bg-[#0b0e13] p-0 text-foreground"
      >
        <DialogHeader className="sticky top-0 z-10 border-b border-[#1d2330] bg-[#0b0e13] px-6 pb-4 pt-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                {step === "policy"
                  ? "Employ Aqua Agents"
                  : step === "vault"
                    ? "Buffer Vault Insurance Setup"
                    : "Insurance Activated"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-slate-400">
                {step === "policy"
                  ? "Create your enrollment policy"
                  : step === "vault"
                    ? "Add insurance capital and activate buffer vault coverage."
                    : "Your buffer vault demo insurance is now active."}
              </DialogDescription>
            </div>
            {step === "policy" && (
              <span className="inline-flex h-5 items-center rounded-sm border border-amber-500/30 bg-amber-500/15 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                DEMO
              </span>
            )}
          </div>
        </DialogHeader>

        {step === "policy" && (
          <>
            <div className="space-y-5 px-6 py-5 sm:px-8">
              {walletError && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                  {walletError}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Identity Configuration
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="enroll-wallet" className="whitespace-nowrap text-xs leading-none text-slate-400">
                      Wallet Address
                    </Label>
                    <Input
                      id="enroll-wallet"
                      value={maskAddress(walletAddress)}
                      readOnly
                      className="h-10 border-[#242c3a] bg-[#0f1520] font-mono text-xs text-slate-200 truncate"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="enroll-display-name" className="whitespace-nowrap text-xs leading-none text-slate-400">
                      Display Name (Optional)
                    </Label>
                    <Input
                      id="enroll-display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Treasury Ops / Risk Desk"
                      className="h-10 border-[#242c3a] bg-[#0f1520] text-xs text-slate-200 placeholder:text-slate-500"
                      maxLength={64}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Policy Mode
                </p>
                <RadioGroup
                  value={mode}
                  onValueChange={(value) => setMode(value as AgentEnrollmentMode)}
                  className="overflow-hidden rounded-md border border-[#242c3a] bg-[#0f1520]"
                >
                  {(Object.keys(MODE_DETAILS) as AgentEnrollmentMode[]).map((value, index) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-[#121b29] ${
                        index > 0 ? "border-t border-[#242c3a]" : ""
                      }`}
                    >
                      <RadioGroupItem value={value} id={`mode-${value}`} className="mt-0.5" />
                      <span className="space-y-0.5">
                        <span className="block text-sm font-medium text-slate-100">
                          {MODE_DETAILS[value].title}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {MODE_DETAILS[value].description}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Notification Channels
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="enroll-telegram" className="text-xs text-slate-400">
                      Telegram Handle
                    </Label>
                    <Input
                      id="enroll-telegram"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="@riskops_team"
                      className="h-10 border-[#242c3a] bg-[#0f1520] text-xs text-slate-200 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="enroll-webhook" className="text-xs text-slate-400">
                      Webhook URL
                    </Label>
                    <Input
                      id="enroll-webhook"
                      value={webhook}
                      onChange={(e) => setWebhook(e.target.value)}
                      placeholder="https://example.com/aquarius/webhook"
                      className="h-10 border-[#242c3a] bg-[#0f1520] text-xs text-slate-200 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-[#242c3a] bg-[#0f1520] px-3 py-2 text-xs text-slate-400">
                Transaction status: {bindingStatusText}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="sticky bottom-0 z-10 border-t border-[#1d2330] bg-[#0b0e13] px-6 py-4 sm:px-8">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={!canSubmit || isSubmitting}
                className="bg-white text-black hover:bg-slate-200"
              >
                {isSubmitting ? "Saving policy..." : "Save Enrollment"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "vault" && (
          <>
            <div className="space-y-6 px-6 py-5 sm:px-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {step === "vault" ? "INSURANCE DEPOSIT" : bindingStatusText}
              </p>

              <div className="rounded-md border border-[#242c3a] bg-[#0f1520]/70 p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2.5">
                    <Label htmlFor="vault-asset" className="text-xs text-slate-400">Asset</Label>
                    <select
                      id="vault-asset"
                      value={vaultAsset}
                      onChange={(event) => setVaultAsset(event.target.value)}
                      className="h-10 rounded-md border border-[#242c3a] bg-[#0f1520] px-3 text-sm text-slate-200 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="WETH">WETH</option>
                    </select>
                  </div>
                  <div className="grid gap-2.5">
                    <Label htmlFor="vault-chain" className="text-xs text-slate-400">Chain</Label>
                    <Input
                      id="vault-chain"
                      value={chain}
                      readOnly
                      className="h-10 border-[#242c3a] bg-[#0f1520] text-slate-200"
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-2.5">
                  <Label htmlFor="vault-amount" className="text-xs text-slate-400">Insurance amount</Label>
                  <Input
                    id="vault-amount"
                    value={vaultAmount}
                    onChange={(event) => setVaultAmount(event.target.value)}
                    placeholder="e.g. 250"
                    inputMode="decimal"
                    className="h-10 border-[#242c3a] bg-[#0f1520] text-slate-200 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {vaultError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {vaultError}
                </div>
              )}
            </div>
            <DialogFooter className="sticky bottom-0 z-10 border-t border-[#1d2330] bg-[#0b0e13] px-6 py-4 sm:px-8">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("policy");
                  setVaultError(null);
                }}
                disabled={isInsuring}
              >
                Back
              </Button>
              <Button
                onClick={async () => {
                  const amount = Number(vaultAmount);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    setVaultError("Enter a valid insurance amount greater than 0.");
                    return;
                  }
                  if (!onBufferVaultDeposit) {
                    setVaultError("Buffer vault demo flow is unavailable in this build.");
                    return;
                  }
                  setVaultError(null);
                  setIsInsuring(true);
                  try {
                    await onBufferVaultDeposit({
                      asset: vaultAsset,
                      amount,
                    });
                    setStep("success");
                    closeTimerRef.current = setTimeout(() => {
                      onOpenChange(false);
                    }, 1400);
                  } catch (err) {
                    setVaultError(
                      err instanceof Error
                        ? err.message
                        : "Failed to complete demo insurance deposit."
                    );
                  } finally {
                    setIsInsuring(false);
                  }
                }}
                disabled={isInsuring}
              >
                {isInsuring ? "Insuring..." : "Insure Position"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <div className="space-y-4 px-6 py-6 sm:px-8">
            <div className="mx-auto max-w-xl rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6">
              <p className="text-sm font-semibold text-emerald-300">
                Buffer Vault insurance activated
              </p>
              <p className="mt-1 text-xs text-emerald-200/90">
                Demo deposit confirmed. Buffer Vault Policy Active is now enabled.
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              Closing this panel...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

