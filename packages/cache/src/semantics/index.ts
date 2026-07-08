// v0.6 cache-lifecycle-orchestrator = 3 provider (Redis + Memcached + KeyDB) 継続合成 layer
export type {
  CacheState,
  CacheEvent,
  CacheSession,
  CacheSummary,
} from './cache-lifecycle-orchestrator.js';
export {
  startCache,
  dispatchEvent as dispatchCacheEvent,
  summarizeCache,
} from './cache-lifecycle-orchestrator.js';
