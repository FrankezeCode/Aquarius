/**
 * Event Engine — WebSocket Provider
 *
 * Resilient WSS connection manager with:
 *   - Auto-reconnect with exponential backoff
 *   - Heartbeat monitoring
 *   - Support for eth_subscribe (logs, newHeads)
 *   - Works with Tenderly WSS and mainnet WSS (Alchemy/Infura)
 *
 * Singleton per URL. Non-blocking. Infrastructure only.
 */

import { EventEmitter } from "node:events";

export type WssConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting";

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

export class WssProvider extends EventEmitter {
  private url: string;
  private ws: WebSocket | null = null;
  private state: WssConnectionState = "disconnected";
  private requestId = 0;
  private pendingRequests = new Map<number, PendingRequest>();
  private subscriptionHandlers = new Map<string, (data: unknown) => void>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(url: string) {
    super();
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.state === "connected") return;
    this.state = "connecting";

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.state = "connected";
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit("connected");
          console.info(`[wss-provider] Connected to ${this.url.slice(0, 40)}...`);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(String(event.data));
        };

        this.ws.onclose = () => {
          this.state = "disconnected";
          this.stopHeartbeat();
          this.emit("disconnected");
          if (!this.destroyed) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (err) => {
          console.error(`[wss-provider] WebSocket error: ${err}`);
          if (this.state === "connecting") {
            reject(new Error("WebSocket connection failed"));
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  async send(method: string, params: unknown[] = []): Promise<unknown> {
    if (!this.ws || this.state !== "connected") {
      throw new Error("[wss-provider] Not connected");
    }

    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.ws!.send(JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      }));

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`[wss-provider] Request ${id} timed out`));
        }
      }, 30_000);
    });
  }

  async subscribe(
    subscriptionType: "logs" | "newHeads",
    params: Record<string, unknown> | undefined,
    handler: (data: unknown) => void
  ): Promise<string> {
    const subParams: unknown[] = subscriptionType === "logs" && params
      ? [subscriptionType, params]
      : [subscriptionType];

    const subscriptionId = (await this.send("eth_subscribe", subParams)) as string;
    this.subscriptionHandlers.set(subscriptionId, handler);
    console.info(`[wss-provider] Subscribed: ${subscriptionType} → ${subscriptionId}`);
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    this.subscriptionHandlers.delete(subscriptionId);
    if (this.state === "connected") {
      await this.send("eth_unsubscribe", [subscriptionId]);
    }
  }

  getState(): WssConnectionState {
    return this.state;
  }

  destroy(): void {
    this.destroyed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.subscriptionHandlers.clear();
    for (const [, req] of this.pendingRequests) {
      req.reject(new Error("Provider destroyed"));
    }
    this.pendingRequests.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw) as Record<string, unknown>;

      if ("id" in msg && typeof msg.id === "number") {
        const pending = this.pendingRequests.get(msg.id);
        if (pending) {
          this.pendingRequests.delete(msg.id);
          if ("error" in msg && msg.error) {
            pending.reject(new Error(JSON.stringify(msg.error)));
          } else {
            pending.resolve(msg.result);
          }
        }
        return;
      }

      if (msg.method === "eth_subscription" && msg.params) {
        const params = msg.params as { subscription: string; result: unknown };
        const handler = this.subscriptionHandlers.get(params.subscription);
        if (handler) {
          handler(params.result);
        }
      }
    } catch {
      console.warn("[wss-provider] Failed to parse message");
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;

    this.state = "reconnecting";
    const delay = Math.min(
      INITIAL_BACKOFF_MS * Math.pow(2, this.reconnectAttempts),
      MAX_BACKOFF_MS
    );
    this.reconnectAttempts++;

    console.info(`[wss-provider] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        await this.resubscribeAll();
      } catch {
        // connect() failure triggers onclose which schedules another reconnect
      }
    }, delay);
  }

  private async resubscribeAll(): Promise<void> {
    const handlers = new Map(this.subscriptionHandlers);
    this.subscriptionHandlers.clear();

    for (const [, handler] of handlers) {
      console.info("[wss-provider] Re-subscribing after reconnect");
      // Handlers will be re-registered by stream classes that detect reconnection
      this.emit("resubscribe", handler);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.send("eth_blockNumber", []);
      } catch {
        console.warn("[wss-provider] Heartbeat failed, connection may be stale");
        if (this.ws) this.ws.close();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
