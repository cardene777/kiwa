import { createStubMemcachedEnv } from './stub-memcached.js';
import { createTestcontainersMemcachedEnv } from './testcontainers-memcached.js';
import type { MemcachedTestEnv, SetupMemcachedEnvOptions } from './types.js';

/**
 * Factory for Memcached test environments.
 *
 * `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no
 * network. Deterministic enough to exercise the 8 core Memcached commands
 * (get / set / delete / add / replace / increment / decrement / flush) plus
 * TTL and multi-server consistent hashing.
 *
 * `mode: 'testcontainers'` connects to a running Memcached endpoint (URL
 * provided via `testcontainers.url`) and verifies TCP responsiveness before
 * returning the env. The env still drives entry state in-process (v0.2 scope)
 * so assertions stay deterministic across backends; callers that want to
 * exercise the real wire can point their own `memjs` / `memcached` client at
 * the exposed `env.memcachedUrl`.
 */
export async function setupMemcachedEnv(
  opts: SetupMemcachedEnvOptions = {},
): Promise<MemcachedTestEnv> {
  const mode = opts.mode ?? 'stub';
  if (mode !== 'stub' && mode !== 'testcontainers') {
    throw new Error(
      `setupMemcachedEnv: unknown mode "${String(mode)}" — expected "stub" or "testcontainers"`,
    );
  }
  if (mode === 'stub') return createStubMemcachedEnv(opts);
  return createTestcontainersMemcachedEnv(opts);
}
