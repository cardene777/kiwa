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

// KeyDB adapter surface (v1.9-6, GH #657).
export type {
  KeyDBAssertTTLExpected,
  KeyDBClient,
  KeyDBEntrySnapshot,
  KeyDBMode,
  KeyDBPubSubMessage,
  KeyDBSubscription,
  KeyDBTestEnv,
  SetupKeyDBEnvOptions,
} from './keydb/types.js';
export { setupKeyDBEnv } from './keydb/setup-keydb-env.js';
export { createStubKeyDBEnv } from './keydb/stub-keydb.js';
export { createTestcontainersKeyDBEnv } from './keydb/testcontainers-keydb.js';
