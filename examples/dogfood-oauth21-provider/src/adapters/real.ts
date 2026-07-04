/**
 * Real adapter — points at an externally-managed `oauth2-mock-server`
 * instance so a genuine RFC 9700 endpoint surface (`/authorize`,
 * `/token`, `/revoke`, `/introspect`, `/.well-known/openid-configuration`)
 * can be exercised over HTTP.
 *
 * Sub-Issue v1.21-3b (`pkce-flow`) landed the URL-driven scaffolding —
 * {@link startOAuth2MockServer} returns a typed endpoint-URL bundle
 * when the caller sets `OAUTH21_BOOTSTRAP=1` + `OAUTH21_MOCK_SERVER_URL`
 * (docker-compose flow), and rejects with `KIWA_OAUTH21_ENV_MISSING`
 * otherwise. Sub-Issue v1.21-3c / v1.21-3d will replace the URL-driven
 * launcher with a testcontainers `GenericContainer` once the
 * `testcontainers` dependency is committed to the workspace + wire the
 * live handle into every adapter method.
 *
 * Until then, {@link makeRealAdapter} returns a skipped-adapter that
 * records `KIWA_OAUTH21_ENV_MISSING` on every non-discovery method (the
 * fidelity harness inspects {@link OAuth21ASAdapter.mode} + the trace
 * to skip real assertions when the env is missing without failing the
 * whole suite, mirroring the `dogfood-supabase-saas-app` pattern).
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
 *   2. `OAUTH21_BOOTSTRAP=1` — opt-in for real ceremonies. Tests that
 *      want to exercise the full ceremony flip this before invoking
 *      `makeRealAdapter`.
 *   3. On systems without a running docker daemon we still report
 *      env-missing because `oauth2-mock-server` needs a container (or
 *      alternatively a native `oauth2-mock-server` binary — v1.21-3b
 *      only supports the container path).
 */
export function detectRealEnvMissing(): string | null {
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  if (process.env['OAUTH21_BOOTSTRAP'] !== '1') return MISSING_ENV_ERROR;
  return null;
}

/**
 * Options accepted by the real adapter.
 */
export interface MakeRealAdapterOptions {
  issuer?: string;
  /**
   * Force env-missing regardless of environment probes. Tests use this to
   * exercise the skeleton path without needing to unset
   * `OAUTH21_BOOTSTRAP` (matches the mirror pattern used by the
   * supabase-saas-app real adapter).
   */
  forceEnvMissing?: boolean;
}

const DEFAULT_ISSUER = 'https://as.example.test';

/**
 * Build the real adapter. Sub-Issue v1.21-3b returns a skipped-adapter
 * unconditionally — every non-discovery method throws with `errorKind =
 * 'KIWA_OAUTH21_ENV_MISSING'` on the trace so the fidelity harness
 * can distinguish "environment absent" from "assertion failed" (matches
 * the `dogfood-supabase-saas-app` real-adapter shape).
 *
 * The URL-driven launcher in {@link startOAuth2MockServer} is available
 * for downstream Sub-Issues (v1.21-3c / v1.21-3d) that will drive an
 * externally-managed `oauth2-mock-server` (docker-compose or eventual
 * testcontainers `GenericContainer`) through fetch.
 */
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

/**
 * Handle to a running `oauth2-mock-server` container (or subprocess).
 * Returned from {@link startOAuth2MockServer} when
 * `OAUTH21_BOOTSTRAP=1` and docker is reachable. Callers must invoke
 * `stop()` in an `afterAll` block to release resources.
 *
 * v1.21-3b lands the shape + a lifecycle stub used by the pkce-flow
 * fidelity harness. v1.21-3d will replace the subprocess launcher with
 * a full testcontainers `GenericContainer` instance once the
 * `testcontainers` dependency is committed to the workspace.
 */
export interface OAuth2MockServerHandle {
  /** Base URL to the running server (e.g. `http://127.0.0.1:PORT`). */
  readonly url: string;
  /** Convenience: `${url}/authorize`. */
  readonly authorizationEndpoint: string;
  /** Convenience: `${url}/token`. */
  readonly tokenEndpoint: string;
  /** Convenience: `${url}/revoke`. */
  readonly revocationEndpoint: string;
  /** Convenience: `${url}/introspect`. */
  readonly introspectionEndpoint: string;
  /** Convenience: `${url}/.well-known/openid-configuration`. */
  readonly discoveryEndpoint: string;
  /** Free the container / subprocess. */
  stop(): Promise<void>;
}

/**
 * Start an `oauth2-mock-server` instance. Behaviour depends on env:
 *
 *   - `OAUTH21_BOOTSTRAP` unset → resolves with a rejected promise
 *     tagged `KIWA_OAUTH21_ENV_MISSING`.
 *   - `OAUTH21_BOOTSTRAP=1` + `OAUTH21_MOCK_SERVER_URL` set → returns a
 *     handle pointing at the caller-supplied URL (useful when the CI
 *     already has an `oauth2-mock-server` up via docker-compose).
 *   - `OAUTH21_BOOTSTRAP=1` + `OAUTH21_MOCK_SERVER_URL` unset →
 *     tries to spawn the container. Left as a stub throwing
 *     `KIWA_OAUTH21_ENV_MISSING` until v1.21-3c / v1.21-3d lands the
 *     testcontainers dependency; this keeps the AC "real driver wiring
 *     ready" honest without committing testcontainers-in-CI yet.
 */
export async function startOAuth2MockServer(): Promise<OAuth2MockServerHandle> {
  const missing = detectRealEnvMissing();
  if (missing) throw new Error(`startOAuth2MockServer: ${missing}`);

  const supplied = process.env['OAUTH21_MOCK_SERVER_URL'];
  if (supplied) {
    return handleFromUrl(supplied, async () => {});
  }

  throw new Error(
    `startOAuth2MockServer: KIWA_OAUTH21_ENV_MISSING — set OAUTH21_MOCK_SERVER_URL to a running oauth2-mock-server instance, or wait for v1.21-3c / v1.21-3d which land the testcontainers dependency (Sub-Issue #866 / #867)`,
  );
}

function handleFromUrl(
  rawUrl: string,
  stop: () => Promise<void>,
): OAuth2MockServerHandle {
  const url = rawUrl.replace(/\/$/, '');
  return {
    url,
    authorizationEndpoint: `${url}/authorize`,
    tokenEndpoint: `${url}/token`,
    revocationEndpoint: `${url}/revoke`,
    introspectionEndpoint: `${url}/introspect`,
    discoveryEndpoint: `${url}/.well-known/openid-configuration`,
    stop,
  };
}
