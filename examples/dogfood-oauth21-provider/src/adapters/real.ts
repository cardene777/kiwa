/**
 * Real adapter — drives an `oauth2-mock-server` instance spawned through
 * testcontainers so a genuine RFC 9700 endpoint surface (`/authorize`,
 * `/token`, `/revoke`, `/introspect`, `/.well-known/openid-configuration`)
 * can be exercised over HTTP.
 *
 * Full testcontainers wiring lands in Sub-Issue v1.21-3b (`pkce-flow`).
 * Sub-Issue v1.21-3a (this one) lands the env-detect skeleton so the
 * fidelity harness can uniformly drive both adapters even when only the
 * mock has an actual body.
 *
 * On systems that cannot reach docker or where the OAUTH21_BOOTSTRAP env
 * flag is unset, every method reports `KIWA_OAUTH21_ENV_MISSING`.
 * Downstream tests inspect {@link OAuth21ASAdapter.mode} + the trace to
 * skip real assertions on those systems.
 */

import type {
  AuthorizationRequest,
  AuthorizationResponse,
  ClientRegistration,
  IntrospectionResponse,
  TokenRequest,
  TokenResponse,
} from '@kiwa-test/auth';
import type {
  DiscoveryMetadata,
  OAuth21ASAdapter,
  TraceEvent,
} from './interface.js';
import { buildDiscovery } from './mock.js';

const MISSING_ENV_ERROR = 'KIWA_OAUTH21_ENV_MISSING';

/**
 * Report whether the current process can talk to a real
 * `oauth2-mock-server`. Returns `null` on capable systems, or a short
 * reason string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The three gates:
 *   1. `KIWA_MODE=mock` — explicit opt-out for tests that stay mock-only.
 *   2. `OAUTH21_BOOTSTRAP=1` — opt-in for real ceremonies. Sub-Issue
 *      v1.21-3b flips this once testcontainers wiring is in place.
 *   3. On non-Linux platforms without a running docker daemon we still
 *      report env-missing because oauth2-mock-server needs a container.
 */
export function detectRealEnvMissing(): string | null {
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  if (process.env['OAUTH21_BOOTSTRAP'] !== '1') return MISSING_ENV_ERROR;
  return null;
}

/**
 * Options accepted by the real adapter. Sub-Issue v1.21-3b will grow this
 * to include container image tag + port + issuer overrides. For now we
 * accept only the issuer + optional pre-detected env-missing reason so
 * tests can force skipping.
 */
export interface MakeRealAdapterOptions {
  issuer?: string;
  /**
   * Force env-missing regardless of environment probes. Tests use this to
   * exercise the skeleton path without needing to unset OAUTH21_BOOTSTRAP.
   */
  forceEnvMissing?: boolean;
}

const DEFAULT_ISSUER = 'https://as.example.test';

export function makeRealAdapter(opts: MakeRealAdapterOptions = {}): OAuth21ASAdapter {
  const trace: TraceEvent[] = [];
  const issuer = opts.issuer ?? DEFAULT_ISSUER;

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function envError(op: TraceEvent['op']): Error {
    const reason = opts.forceEnvMissing ? MISSING_ENV_ERROR : (detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    record(op, false, { errorKind: reason });
    return new Error(`makeRealAdapter.${op}: ${reason}`);
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    registerClient(_client: ClientRegistration): void {
      throw envError('registerClient');
    },

    registerUser(_user: { subject: string; scopes?: readonly string[] }): void {
      throw envError('registerUser');
    },

    discovery(): DiscoveryMetadata {
      // Discovery is the one operation that can safely return the
      // metadata shape even without a running container — the shape is
      // static per issuer. Real ceremonies still error because the
      // container is not up, but a client can inspect discovery and
      // decide whether to proceed.
      const doc = buildDiscovery(issuer);
      record('discovery', true, { detail: { issuer, envReady: false } });
      return doc;
    },

    authorize(
      _request: AuthorizationRequest,
      _subject: string,
    ): AuthorizationResponse {
      throw envError('authorize');
    },

    token(_request: TokenRequest): TokenResponse {
      throw envError('token');
    },

    revoke(_token: string, _clientId: string): void {
      throw envError('revoke');
    },

    introspect(_token: string): IntrospectionResponse {
      throw envError('introspect');
    },

    async reset(): Promise<void> {
      trace.length = 0;
    },
  };
}
