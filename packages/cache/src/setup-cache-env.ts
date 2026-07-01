import { createInMemoryCacheEnv } from './in-memory-cache.js';
import { createTestcontainersCacheEnv } from './testcontainers-cache.js';
import type { CacheTestEnv, SetupCacheEnvOptions } from './types.js';

/**
 * Factory for Redis cache test environments.
 *
 * `mode: 'in-memory'` (default) returns a fast, in-process Redis-shaped fake —
 * no Docker, no peer dependencies required beyond the fixture package itself.
 * Use it for the fast unit-test lane.
 *
 * `mode: 'testcontainers'` boots a real Redis under testcontainers and wires
 * up either `ioredis` or `redis` (node-redis v4) as the client. Use it for the
 * integration lane that needs prod-shape parity.
 */
export async function setupCacheEnv(
  opts: SetupCacheEnvOptions = {},
): Promise<CacheTestEnv> {
  const mode = opts.mode ?? 'in-memory';
  if (mode !== 'in-memory' && mode !== 'testcontainers') {
    throw new Error(
      `setupCacheEnv: unknown mode "${String(mode)}" — expected "in-memory" or "testcontainers"`,
    );
  }
  const client = opts.client ?? 'ioredis';
  if (client !== 'ioredis' && client !== 'node-redis') {
    throw new Error(
      `setupCacheEnv: unknown client "${String(client)}" — expected "ioredis" or "node-redis"`,
    );
  }
  if (mode === 'in-memory') {
    return createInMemoryCacheEnv(opts);
  }
  return createTestcontainersCacheEnv(opts);
}
