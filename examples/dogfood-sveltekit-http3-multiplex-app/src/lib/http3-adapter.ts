/**
 * HTTP/3 adapter routing — the entry point the SvelteKit app uses to pick
 * between real (nginx-quic testcontainers) and mock (@kiwa-lab/realtime
 * v0.2) at runtime. Inherits the 8-axis routing shape from v1.28-1 so
 * downstream dogfoods can reuse this pattern with a one-liner switch on the
 * axis.
 *
 * Priority order —
 *  1. explicit `mode: 'real'` or `mode: 'mock'` in the input
 *  2. `KIWA_MODE=real` env var (only when the nginx-quic env-detect passes)
 *  3. `KIWA_MODE=mock` env var
 *  4. mock (default — hermetic, deterministic)
 *
 * The router only decides which factory to call; the two factories remain
 * the sole source of truth for the adapter contract.
 */

import { makeMockAdapter, type MakeMockAdapterOptions } from '../adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../adapters/real.js';
import type { Http3MultiplexAdapter } from '../adapters/interface.js';

export type AdapterMode = 'real' | 'mock';

export interface ResolveAdapterInput {
  /** Explicit mode; wins over env vars when set. */
  mode?: AdapterMode;
  /** Passed through to `makeMockAdapter` when the mock path is chosen. */
  mockOptions?: MakeMockAdapterOptions;
}

export interface ResolveAdapterResult {
  adapter: Http3MultiplexAdapter;
  chosenMode: AdapterMode;
  /** null when real was chosen and available; a reason string otherwise. */
  realEnvMissingReason: string | null;
}

/**
 * Pick and construct an {@link Http3MultiplexAdapter} for the current
 * request or test. The chosen mode is returned separately so callers can add
 * it to their telemetry / trace metadata without introspecting
 * `adapter.mode`.
 */
export function resolveHttp3Adapter(
  input: ResolveAdapterInput = {},
): ResolveAdapterResult {
  const envMode = process.env['KIWA_MODE'];
  const requested: AdapterMode | undefined =
    input.mode ??
    (envMode === 'real' ? 'real' : envMode === 'mock' ? 'mock' : undefined);
  const realEnvMissingReason = detectRealEnvMissing();
  // The real adapter refuses to run unless the nginx-quic env-detect passes.
  // If the caller explicitly asked for real but the env is missing we still
  // return the real adapter so downstream tests can assert on the trace
  // errorKind rather than silently getting the mock.
  if (requested === 'real') {
    return {
      adapter: makeRealAdapter(),
      chosenMode: 'real',
      realEnvMissingReason,
    };
  }
  if (requested === 'mock') {
    return {
      adapter: makeMockAdapter(input.mockOptions),
      chosenMode: 'mock',
      realEnvMissingReason,
    };
  }
  // Default — pick real when the env allows, mock otherwise.
  if (realEnvMissingReason === null) {
    return {
      adapter: makeRealAdapter(),
      chosenMode: 'real',
      realEnvMissingReason: null,
    };
  }
  return {
    adapter: makeMockAdapter(input.mockOptions),
    chosenMode: 'mock',
    realEnvMissingReason,
  };
}
