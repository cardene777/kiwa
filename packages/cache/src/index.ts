export type {
  AssertTTLExpected,
  CacheClient,
  CacheMode,
  CacheSubscription,
  CacheTestEnv,
  PubSubMessage,
  SetupCacheEnvOptions,
} from './types.js';
export { setupCacheEnv } from './setup-cache-env.js';
export { createInMemoryCacheEnv } from './in-memory-cache.js';
export { createTestcontainersCacheEnv } from './testcontainers-cache.js';

// Memcached adapter surface (v1.9-5, GH #656).
export type {
  MemcachedAssertTTLExpected,
  MemcachedClient,
  MemcachedEntrySnapshot,
  MemcachedMode,
  MemcachedTestEnv,
  SetupMemcachedEnvOptions,
} from './memcached/types.js';
export { setupMemcachedEnv } from './memcached/setup-memcached-env.js';
export { createStubMemcachedEnv } from './memcached/stub-memcached.js';
export { createTestcontainersMemcachedEnv } from './memcached/testcontainers-memcached.js';
