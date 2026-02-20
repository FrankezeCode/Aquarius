/**
 * Tenderly — RPC Client (Infrastructure Only)
 *
 * Low-level JSON-RPC wrapper for Tenderly-specific RPC methods:
 *   - tenderly_setBalance
 *   - tenderly_setErc20Balance
 *   - tenderly_setStorageAt
 *   - evm_snapshot / evm_revert
 *
 * Only ForkController and infrastructure adapters should use this.
 * Domain layer NEVER imports this file.
 */

export interface TenderlyRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

export class TenderlyRpcClient {
  private rpcUrl: string;
  private requestId = 0;

  constructor(rpcUrl: string) {
    if (!rpcUrl) {
      throw new Error("TenderlyRpcClient requires a valid RPC URL.");
    }
    this.rpcUrl = rpcUrl;
  }

  private async call<T = unknown>(
    method: string,
    params: unknown[] = []
  ): Promise<T> {
    const id = ++this.requestId;

    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id }),
    });

    const json = (await response.json()) as TenderlyRpcResponse<T>;

    if (json.error) {
      throw new Error(
        `[tenderly-rpc] ${method} failed: ${json.error.message} (code=${json.error.code})`
      );
    }

    return json.result as T;
  }

  /**
   * Set the ETH balance of an address (wei, hex-encoded).
   */
  async setBalance(address: string, balanceWei: string): Promise<void> {
    await this.call("tenderly_setBalance", [address, balanceWei]);
    console.info(`[tenderly-rpc] setBalance ${address} → ${balanceWei}`);
  }

  /**
   * Set ERC-20 token balance for an address.
   */
  async setErc20Balance(
    token: string,
    address: string,
    balance: string
  ): Promise<void> {
    await this.call("tenderly_setErc20Balance", [token, address, balance]);
    console.info(`[tenderly-rpc] setErc20Balance ${token} ${address} → ${balance}`);
  }

  /**
   * Directly modify contract storage at a slot.
   * Used for oracle price manipulation, etc.
   */
  async setStorageAt(
    contract: string,
    slot: string,
    value: string
  ): Promise<void> {
    await this.call("tenderly_setStorageAt", [contract, slot, value]);
    console.info(`[tenderly-rpc] setStorageAt ${contract} slot=${slot}`);
  }

  /**
   * Snapshot the current fork state. Returns a snapshot ID.
   */
  async snapshot(): Promise<string> {
    const id = await this.call<string>("evm_snapshot", []);
    console.info(`[tenderly-rpc] snapshot created: ${id}`);
    return id;
  }

  /**
   * Revert fork state to a previous snapshot.
   */
  async revert(snapshotId: string): Promise<boolean> {
    const result = await this.call<boolean>("evm_revert", [snapshotId]);
    console.info(`[tenderly-rpc] reverted to snapshot: ${snapshotId}`);
    return result;
  }

  /**
   * Standard eth_sendTransaction with Tenderly impersonation.
   * Tenderly forks auto-approve transactions from any sender.
   */
  async sendTransaction(tx: {
    from: string;
    to: string;
    data: string;
    value?: string;
    gas?: string;
  }): Promise<string> {
    const txHash = await this.call<string>("eth_sendTransaction", [tx]);
    console.info(`[tenderly-rpc] tx sent: ${txHash}`);
    return txHash;
  }

  /**
   * Send a contract deployment transaction (no `to` field).
   * Tenderly requires `to` to be absent for contract creation.
   */
  async sendDeployTransaction(tx: {
    from: string;
    data: string;
    value?: string;
    gas?: string;
  }): Promise<string> {
    const txHash = await this.call<string>("eth_sendTransaction", [tx]);
    console.info(`[tenderly-rpc] deploy tx sent: ${txHash}`);
    return txHash;
  }

  /**
   * Wait for transaction receipt.
   */
  async getTransactionReceipt(txHash: string): Promise<Record<string, unknown> | null> {
    return this.call("eth_getTransactionReceipt", [txHash]);
  }

  getRpcUrl(): string {
    return this.rpcUrl;
  }
}
