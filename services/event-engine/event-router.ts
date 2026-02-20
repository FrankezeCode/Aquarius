/**
 * Event Engine — Event Router
 *
 * Central async dispatcher for all stream events.
 * Non-blocking: handlers execute in microtask queue.
 *
 * Responsibilities:
 *   - Receive all low-level events from streams
 *   - Forward to position graph store for state updates
 *   - Forward to registered listeners (prediction engine, monitors)
 *   - Never block the event loop
 *
 * Uses typed EventEmitter pattern. Zero external dependencies.
 */

import { EventEmitter } from "node:events";
import type {
  StreamEvent,
  StreamEventType,
  EventHandler,
  EventSubscription,
} from "./types.js";

export class EventRouter {
  private emitter = new EventEmitter();
  private eventCount = 0;
  private lastEventTimestamp = 0;

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  /**
   * Dispatch an event to all registered handlers.
   * Non-blocking: uses queueMicrotask to avoid blocking streams.
   */
  dispatch(event: StreamEvent): void {
    this.eventCount++;
    this.lastEventTimestamp = Date.now();

    queueMicrotask(() => {
      this.emitter.emit(event.type, event);
      this.emitter.emit("*", event);
    });
  }

  /**
   * Subscribe to a specific event type.
   */
  on<T extends StreamEvent>(
    eventType: T["type"],
    handler: EventHandler<T>
  ): EventSubscription {
    this.emitter.on(eventType, handler as EventHandler);
    return {
      unsubscribe: () => this.emitter.off(eventType, handler as EventHandler),
    };
  }

  /**
   * Subscribe to ALL events (wildcard).
   */
  onAny(handler: EventHandler): EventSubscription {
    this.emitter.on("*", handler);
    return {
      unsubscribe: () => this.emitter.off("*", handler),
    };
  }

  /**
   * Subscribe to a specific event type, fire once.
   */
  once<T extends StreamEvent>(
    eventType: T["type"],
    handler: EventHandler<T>
  ): void {
    this.emitter.once(eventType, handler as EventHandler);
  }

  /**
   * Remove all handlers for a specific event type.
   */
  removeAll(eventType?: StreamEventType): void {
    if (eventType) {
      this.emitter.removeAllListeners(eventType);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  /**
   * Diagnostics: total events dispatched since startup.
   */
  getStats(): { eventCount: number; lastEventTimestamp: number } {
    return {
      eventCount: this.eventCount,
      lastEventTimestamp: this.lastEventTimestamp,
    };
  }
}
