/**
 * Adapter resolver — reads `KIWA_MODE` + `ANTHROPIC_API_KEY` +
 * `KIWA_LLM_BUDGET_USD` and returns the correct LLM code interpreter
 * adapter for the current environment.
 *
 * The resolver is the single place that inspects env keys — every
 * other module accepts an already-constructed adapter so tests can
 * inject either flavor without polluting process.env.
 */

import {
  makeMockAdapter,
  type MakeMockAdapterOptions,
} from '../adapters/mock.js';
import { makeRealAdapter } from '../adapters/real.js';
import type { LlmCodeInterpreterAdapter } from '../adapters/interface.js';

export interface ResolveAdapterOptions {
  /** override — force a specific mode regardless of env. */
  mode?: 'real' | 'mock';
  /** forwarded to `makeMockAdapter` when the resolved mode is mock. */
  mockOptions?: MakeMockAdapterOptions;
}

export function resolveAdapter(
  opts: ResolveAdapterOptions = {},
): LlmCodeInterpreterAdapter {
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
