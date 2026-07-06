/**
 * Adapter resolver — reads `KIWA_MODE` + `SERVER_ACTION_BROWSER_READY` and
 * returns the correct Server Action adapter for the current environment.
 *
 * The resolver is the single place that inspects env keys — every other
 * module accepts an already-constructed adapter so tests can inject either
 * flavor without polluting process.env.
 */

import { makeMockAdapter, type MakeMockAdapterOptions } from '../adapters/mock.js';
import { makeRealAdapter } from '../adapters/real.js';
import type { ServerActionAdapter } from '../adapters/interface.js';

export interface ResolveAdapterOptions {
  /** override — force a specific mode regardless of env. */
  mode?: 'real' | 'mock';
  /** forwarded to `makeMockAdapter` when the resolved mode is mock. */
  mockOptions?: MakeMockAdapterOptions;
}

export function resolveAdapter(opts: ResolveAdapterOptions = {}): ServerActionAdapter {
  const explicit = opts.mode ?? envMode();
  if (explicit === 'real') {
    return makeRealAdapter();
  }
  return makeMockAdapter(opts.mockOptions ?? {});
}

function envMode(): 'real' | 'mock' {
  const kiwaMode = process.env['KIWA_MODE'];
  if (kiwaMode === 'real') return 'real';
  return 'mock';
}
