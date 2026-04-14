import { loadConfig } from "../../config/index.js";
import type { OrchestrationJobStore } from "../../application/ports/orchestration-job-store.port.js";
import { MemoryOrchestrationJobStore } from "./memory-orchestration-job-store.js";
import {
  createRedisClient,
  RedisOrchestrationJobStore,
} from "./redis-orchestration-job-store.js";

let store: OrchestrationJobStore | null = null;
let redisClient: ReturnType<typeof createRedisClient> | null = null;

export function getOrchestrationJobStore(): OrchestrationJobStore {
  if (store) return store;
  const cfg = loadConfig();
  const url = cfg.orchestrationRedisUrl?.trim();
  if (url) {
    redisClient = createRedisClient(url);
    store = new RedisOrchestrationJobStore(
      redisClient,
      cfg.orchestrationJobTtlSeconds
    );
  } else {
    store = new MemoryOrchestrationJobStore();
  }
  return store;
}

/** Tests: clear singletons so next access picks up config / fresh memory. */
export function resetOrchestrationJobStoreForTests(): void {
  if (store instanceof MemoryOrchestrationJobStore) {
    store.clear();
  }
  store = null;
  if (redisClient) {
    try {
      redisClient.disconnect();
    } catch {
      /* ignore */
    }
    redisClient = null;
  }
}
