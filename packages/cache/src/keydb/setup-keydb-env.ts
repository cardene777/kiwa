import { createStubKeyDBEnv } from './stub-keydb.js';
import { createTestcontainersKeyDBEnv } from './testcontainers-keydb.js';
import type { KeyDBTestEnv, SetupKeyDBEnvOptions } from './types.js';

/**
 * Factory for KeyDB test environments.
 *
 * `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no
 * network. Deterministic enough to exercise Redis-compatible GET / SET /
 * DELETE / TTL / Pub/Sub plus KeyDB-specific multi-master replication
 * semantics.
 *
 * `mode: 'testcontainers'` connects to a running KeyDB endpoint (URL
 * provided via `testcontainers.url`) and verifies TCP responsiveness. The
 * env still drives entry state in-process (v0.2 scope) so assertions stay
 * deterministic across backends.
 */
export async function setupKeyDBEnv(
  opts: SetupKeyDBEnvOptions = {},
): Promise<KeyDBTestEnv> {
  const mode = opts.mode ?? 'stub';
  if (mode !== 'stub' && mode !== 'testcontainers') {
    throw new Error(
      `setupKeyDBEnv: unknown mode "${String(mode)}" — expected "stub" or "testcontainers"`,
    );
  }
  if (mode === 'stub') return createStubKeyDBEnv(opts);
  return createTestcontainersKeyDBEnv(opts);
}
