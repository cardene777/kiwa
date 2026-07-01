import { createStubInngestEnv } from './stub-inngest.js';
import { createDevServerInngestEnv } from './dev-server-inngest.js';
import type { InngestTestEnv, SetupInngestEnvOptions } from './types.js';

const DEFAULT_APP_ID = 'kiwa-test-app';

/**
 * Factory for Inngest test environments.
 *
 * `mode: 'stub'` (default) returns a fast, in-process fake — no dev-server, no
 * network. Suitable for unit tests that need to exercise retry / step /
 * concurrency semantics deterministically.
 *
 * `mode: 'dev-server'` boots (or connects to) a real Inngest dev-server and
 * routes every event through the wire before dispatching function handlers.
 * Suitable for integration tests that need prod-shape parity.
 */
export async function setupInngestEnv(
  opts: SetupInngestEnvOptions = {},
): Promise<InngestTestEnv> {
  const appId = opts.appId ?? DEFAULT_APP_ID;
  const mode = opts.mode ?? 'stub';
  if (mode !== 'stub' && mode !== 'dev-server') {
    throw new Error(
      `setupInngestEnv: unknown mode "${String(mode)}" — expected "stub" or "dev-server"`,
    );
  }
  if (mode === 'stub') {
    return createStubInngestEnv({ ...opts, appId });
  }
  return createDevServerInngestEnv({ ...opts, appId });
}
