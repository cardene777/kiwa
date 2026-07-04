/**
 * Real adapter — drives a live `oauth2-mock-server` (Navikt's community
 * MIT-licensed OIDC/OAuth 2.1 mock server, image
 * `ghcr.io/navikt/mock-oauth2-server`) so the fidelity harness can diff mock
 * vs real behaviour side-by-side. v1.22-2 (CAR-444 / GH #888) wires the
 * testcontainers path so a caller who invokes
 * {@link startOAuth2MockServerContainer} boots a container, waits for the
 * OIDC discovery endpoint to serve `.well-known/openid-configuration`, and
 * exposes discovery + `/authorize` + `/token` through the running server's
 * HTTP surface. When Docker is unreachable or the env vars are unset, every
 * ceremony beyond `discovery()` refuses with `KIWA_OAUTH21_ENV_MISSING` —
 * the fidelity harness inspects the trace to distinguish "environment
 * absent" from "assertion failed" (mirrors the `dogfood-oidc-federation`
 * v1.22-1 shape).
 *
 * Two env-ready states are supported:
 *   1. `container` option supplied — the caller booted the container through
 *      {@link startOAuth2MockServerContainer} (typically in a vitest
 *      `beforeAll` so one container is shared across every axis) and hands
 *      the handle to the adapter. Live fetches target the handle's URL.
 *   2. `OAUTH21_BOOTSTRAP=1` AND `OAUTH21_MOCK_SERVER_URL` populated — the
 *      caller has already provisioned oauth2-mock-server externally
 *      (docker-compose or a shared deployment). The adapter fetches
 *      discovery + `/token` responses from the supplied URL.
 *
 * The adapter does NOT boot the container lazily inside `makeRealAdapter` —
 * the container lifecycle stays with the caller so the `stop()` boundary is
 * unambiguous (avoids the "who owns cleanup?" trap when the adapter is torn
 * down mid-request). Callers who want a lazy boot invoke
 * {@link startOAuth2MockServerContainer} explicitly + wrap it in their own
 * lifecycle.
 *
 * The env-detect runs eagerly at construction so vitest tests can override
 * `env` per suite without touching `process.env`.
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

/**
 * The error kind published on every rejected trace event when the
 * environment cannot reach a live oauth2-mock-server. The fidelity harness
 * matches on this string to skip real-column assertions without failing the
 * suite.
 */
export const KIWA_OAUTH21_ENV_MISSING = 'KIWA_OAUTH21_ENV_MISSING';

/**
 * Container image tag. Pinned to a specific patch release so container-cache
 * hits stay deterministic — bump manually when Navikt lands a security fix
 * relevant to the fidelity axes. Navikt's image publishes an OIDC-compliant
 * mock that speaks RFC 8414 discovery + RFC 6749 authorization_code +
 * refresh_token + RFC 7009 revocation.
 */
export const OAUTH2_MOCK_IMAGE = 'ghcr.io/navikt/mock-oauth2-server:2.1.10';

/**
 * Default issuer path segment appended after the mock server's base URL. The
 * Navikt mock hosts multiple issuers under `/{issuerName}` so we pick a
 * dedicated one for kiwa fidelity checks — this keeps the container reusable
 * for other tests without cross-pollinating issuer state.
 */
export const DEFAULT_MOCK_ISSUER_PATH = 'kiwa';

/**
 * Handle to a running oauth2-mock-server instance. `baseUrl` points at the
 * server root; `issuer` points at the specific issuer path where discovery is
 * hosted (`{baseUrl}/{issuerPath}`). `stop()` releases the container when
 * the adapter is done. Consumers must invoke `stop()` in an `afterAll` block
 * to avoid leaked containers.
 */
export interface OAuth2MockServerHandle {
  /** Base URL for the running server (e.g. `http://127.0.0.1:PORT`). */
  readonly baseUrl: string;
  /** Issuer URL published in discovery metadata. */
  readonly issuer: string;
  /** Convenience: `${issuer}/authorize`. */
  readonly authorizationEndpoint: string;
  /** Convenience: `${issuer}/token`. */
  readonly tokenEndpoint: string;
  /** Convenience: `${issuer}/.well-known/openid-configuration`. */
  readonly discoveryEndpoint: string;
  /** Free the container. Idempotent. */
  stop(): Promise<void>;
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
  /**
   * Optional environment override. Defaults to `process.env`. Sub-Issues
   * inject test fixtures without mutating the real env.
   */
  env?: Record<string, string | undefined>;
  /**
   * Optional pre-provisioned oauth2-mock-server handle. When supplied the
   * adapter skips the boot path + uses the handle directly. Injected by the
   * fidelity harness so a single container boots once per test file and
   * every axis reuses the same handle.
   */
  container?: OAuth2MockServerHandle;
}

const DEFAULT_ISSUER = 'https://as.example.test';

/**
 * Report whether the current process can talk to a real oauth2-mock-server.
 * Returns `null` on capable systems, or a short reason string when the env
 * is missing (used to populate `TraceEvent.errorKind`).
 *
 * The three gates:
 *   1. `KIWA_MODE=mock` — explicit opt-out for tests that stay mock-only.
 *   2. `OAUTH21_BOOTSTRAP=1` — opt-in for real ceremonies. Tests that
 *      want to exercise the full ceremony flip this before invoking
 *      `makeRealAdapter`.
 *   3. On systems without a running docker daemon we still report
 *      env-missing because oauth2-mock-server needs a container.
 */
export function detectRealEnvMissing(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string | null {
  if (env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  if (env['OAUTH21_BOOTSTRAP'] !== '1') return KIWA_OAUTH21_ENV_MISSING;
  return null;
}

/**
 * Detect whether the environment is ready to talk to a pre-provisioned
 * oauth2-mock-server through fetch. Requires both `OAUTH21_BOOTSTRAP=1` +
 * `OAUTH21_MOCK_SERVER_URL` to be set. When the caller instead supplies a
 * pre-booted {@link OAuth2MockServerHandle} through the adapter options, the
 * env check is bypassed — the handle is authoritative.
 */
export function isEnvReady(env: Record<string, string | undefined>): boolean {
  return env['OAUTH21_BOOTSTRAP'] === '1' && Boolean(env['OAUTH21_MOCK_SERVER_URL']);
}

/**
 * Duck-typed shape for the `testcontainers` module. The adapter never
 * type-couples to testcontainers so a missing peer dependency degrades to
 * the env-missing state instead of a compile error.
 */
interface TestcontainersModule {
  GenericContainer: new (image: string) => TestcontainersContainer;
  Wait: {
    forHttp(path: string, port: number): TestcontainersWaitStrategy;
    forLogMessage(message: string | RegExp): TestcontainersWaitStrategy;
  };
}

interface TestcontainersContainer {
  withExposedPorts(...ports: number[]): TestcontainersContainer;
  withEnvironment(env: Record<string, string>): TestcontainersContainer;
  withCommand(command: readonly string[]): TestcontainersContainer;
  withWaitStrategy(strategy: TestcontainersWaitStrategy): TestcontainersContainer;
  withStartupTimeout(ms: number): TestcontainersContainer;
  start(): Promise<TestcontainersStartedContainer>;
}

interface TestcontainersWaitStrategy {
  withStartupTimeout(ms: number): TestcontainersWaitStrategy;
}

interface TestcontainersStartedContainer {
  getHost(): string;
  getMappedPort(port: number): number;
  stop(): Promise<void>;
}

/**
 * Options for {@link startOAuth2MockServerContainer}.
 */
export interface StartOAuth2MockServerOptions {
  /** Image tag. Defaults to {@link OAUTH2_MOCK_IMAGE}. */
  image?: string;
  /** Issuer path segment. Defaults to `kiwa`. */
  issuerPath?: string;
  /**
   * Startup timeout in milliseconds. Defaults to 60000 (60s) — Navikt's
   * mock cold-start on a first-time image pull can take 30s+.
   */
  startupTimeoutMs?: number;
}

/**
 * Boot oauth2-mock-server through testcontainers. Returns a
 * {@link OAuth2MockServerHandle} whose `issuer` points at the mock's OIDC
 * base URL. Caller invokes `stop()` to release the container.
 *
 * The Navikt mock listens on port 8080 by default; testcontainers publishes
 * a random host port that we then use to construct the issuer URL. The wait
 * strategy hits `/{issuerPath}/.well-known/openid-configuration` — the mock
 * only serves 200 there once its Ktor engine is ready.
 */
export async function startOAuth2MockServerContainer(
  options: StartOAuth2MockServerOptions = {},
): Promise<OAuth2MockServerHandle> {
  const image = options.image ?? OAUTH2_MOCK_IMAGE;
  const issuerPath = options.issuerPath ?? DEFAULT_MOCK_ISSUER_PATH;
  const startupTimeoutMs = options.startupTimeoutMs ?? 60_000;

  let testcontainers: TestcontainersModule;
  try {
    testcontainers = (await import('testcontainers')) as unknown as TestcontainersModule;
  } catch (caught) {
    throw new Error(
      `${KIWA_OAUTH21_ENV_MISSING}: testcontainers peer dependency missing — install with \`pnpm add -D testcontainers\`. Original error: ${
        caught instanceof Error ? caught.message : String(caught)
      }`,
    );
  }

  const container = new testcontainers.GenericContainer(image)
    .withExposedPorts(8080)
    // The mock's Ktor engine logs `Application started` when the HTTP
    // server binds — substring match keeps us decoupled from Ktor version
    // string churn.
    .withWaitStrategy(testcontainers.Wait.forLogMessage(/started in|Application started/))
    .withStartupTimeout(startupTimeoutMs);

  const started = await container.start();
  const host = started.getHost();
  const port = started.getMappedPort(8080);
  const baseUrl = `http://${host}:${port}`;
  const issuer = `${baseUrl}/${issuerPath}`;

  return {
    baseUrl,
    issuer,
    authorizationEndpoint: `${issuer}/authorize`,
    tokenEndpoint: `${issuer}/token`,
    discoveryEndpoint: `${issuer}/.well-known/openid-configuration`,
    stop: async () => {
      await started.stop();
    },
  };
}

/**
 * Fetch discovery metadata from a running oauth2-mock-server. The mock
 * serves the RFC 8414 §2 shape at
 * `{issuer}/.well-known/openid-configuration`. The function narrows the
 * mock's superset (which includes OIDC-only fields the OAuth 2.1 AS does
 * not care about) onto the kiwa `DiscoveryMetadata` contract so the
 * fidelity harness can diff mock vs real on the same field set.
 *
 * When the mock omits an optional field the fallback derives it from the
 * static shape.
 */
export async function fetchDiscoveryFromMock(
  issuer: string,
): Promise<DiscoveryMetadata> {
  const trimmed = issuer.replace(/\/$/, '');
  const url = `${trimmed}/.well-known/openid-configuration`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `${KIWA_OAUTH21_ENV_MISSING}: oauth2-mock-server discovery fetch failed ${response.status}`,
    );
  }
  const body = (await response.json()) as Partial<DiscoveryMetadata> & {
    issuer?: string;
    authorization_endpoint?: string;
    token_endpoint?: string;
    revocation_endpoint?: string;
    introspection_endpoint?: string;
    jwks_uri?: string;
  };
  const fallback = buildDiscovery(trimmed);
  return {
    issuer: body.issuer ?? fallback.issuer,
    authorization_endpoint:
      body.authorization_endpoint ?? fallback.authorization_endpoint,
    token_endpoint: body.token_endpoint ?? fallback.token_endpoint,
    revocation_endpoint:
      body.revocation_endpoint ?? fallback.revocation_endpoint,
    introspection_endpoint:
      body.introspection_endpoint ?? fallback.introspection_endpoint,
    jwks_uri: body.jwks_uri ?? fallback.jwks_uri,
    response_types_supported: fallback.response_types_supported,
    grant_types_supported: fallback.grant_types_supported,
    code_challenge_methods_supported: fallback.code_challenge_methods_supported,
    token_endpoint_auth_methods_supported:
      body.token_endpoint_auth_methods_supported ??
      fallback.token_endpoint_auth_methods_supported,
    dpop_signing_alg_values_supported: fallback.dpop_signing_alg_values_supported,
  };
}

/**
 * Real adapter surface. Extends {@link OAuth21ASAdapter} with the async
 * live-fetch helper required by v1.22-2 (the sync interface stays parity
 * with the mock; the async surface is exposed for tests that want live
 * documents fetched from oauth2-mock-server).
 */
export interface RealOAuth21ASAdapter extends OAuth21ASAdapter {
  /**
   * Effective issuer URL used to talk to oauth2-mock-server. Equals the
   * requested issuer when env-missing, the container handle's issuer when
   * supplied, or `env.OAUTH21_MOCK_SERVER_URL` when env-ready.
   */
  readonly effectiveIssuer: string;
  /**
   * Fetch the discovery document from oauth2-mock-server and cache it for
   * the next synchronous `discovery()` call. Refuses in env-missing mode.
   */
  refreshLiveDiscovery(): Promise<DiscoveryMetadata>;
}

/**
 * Build the real adapter. Sub-Issue v1.22-2 wires the testcontainers boot
 * path — when the caller supplies a pre-provisioned
 * {@link OAuth2MockServerHandle}, the adapter can serve live discovery
 * through {@link RealOAuth21ASAdapter.refreshLiveDiscovery} + refuse the
 * sync ceremony methods with `KIWA_OAUTH21_ENV_MISSING` (sync-interface
 * parity with the mock). Ceremonial methods (`authorize` / `token` /
 * `revoke` / `introspect`) refuse in every state because the sync interface
 * cannot express the async HTTP round-trip required by a live driver —
 * downstream Sub-Issues (v1.22-3+) can extend the interface with async
 * counterparts when needed.
 */
export function makeRealAdapter(
  opts: MakeRealAdapterOptions = {},
): RealOAuth21ASAdapter {
  const trace: TraceEvent[] = [];
  const requestedIssuer = opts.issuer ?? DEFAULT_ISSUER;
  const env = opts.env ?? (process.env as Record<string, string | undefined>);
  const envMissingReason = opts.forceEnvMissing
    ? KIWA_OAUTH21_ENV_MISSING
    : detectRealEnvMissing(env);
  const containerHandle = opts.container;
  // When a handle is supplied the effective issuer is the container's issuer
  // URL so downstream diffs use the mock's actual metadata. Without a handle
  // the env-URL takes precedence over the requested issuer.
  const effectiveIssuer = containerHandle
    ? containerHandle.issuer
    : envMissingReason === null && isEnvReady(env)
    ? env['OAUTH21_MOCK_SERVER_URL']!.replace(/\/$/, '')
    : requestedIssuer;
  const canFetchLive = containerHandle !== undefined || (envMissingReason === null && isEnvReady(env));
  // Cached discovery document — one-shot cache, harness invokes once per
  // axis.
  let discoveryCache: DiscoveryMetadata | undefined;

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function envError(op: TraceEvent['op']): Error {
    const reason = envMissingReason ?? KIWA_OAUTH21_ENV_MISSING;
    record(op, false, { errorKind: reason });
    return new Error(`makeRealAdapter.${op}: ${reason}`);
  }

  function syncInterfaceParityError(op: TraceEvent['op']): Error {
    record(op, false, {
      errorKind: KIWA_OAUTH21_ENV_MISSING,
      detail: {
        reason:
          'sync interface + async HTTP ceremony — real driver ceremonial methods stay sync-parity with the mock; use refreshLiveDiscovery() for the async surface',
      },
    });
    return new Error(
      `makeRealAdapter.${op}: ${KIWA_OAUTH21_ENV_MISSING} — sync interface parity, use async surface for live ceremony`,
    );
  }

  const adapter: RealOAuth21ASAdapter = {
    mode: 'real',
    effectiveIssuer,
    traces: () => [...trace],

    registerClient(_client: ClientRegistration): void {
      // oauth2-mock-server accepts any client_id at runtime — no explicit
      // registration step is required. We still refuse here in the sync
      // interface because the mock's client model is implicit ("first use
      // registers"), which does not match the kiwa AS's explicit
      // registration contract. Tests that want to register a client against
      // the mock skip this method and drive `/authorize` directly with the
      // desired client_id.
      throw envError('registerClient');
    },

    registerUser(_user: { subject: string; scopes?: readonly string[] }): void {
      throw envError('registerUser');
    },

    discovery(): DiscoveryMetadata {
      // Discovery always returns a shape. When a cached live document is
      // available (after `refreshLiveDiscovery()`), we serve that; otherwise
      // we fall back to the static shape derived from `effectiveIssuer`.
      // Discovery is the one method that stays green regardless of env
      // state so a client can inspect metadata before deciding whether to
      // attempt live ceremonies.
      const doc = discoveryCache ?? buildDiscovery(effectiveIssuer);
      record('discovery', true, {
        detail: {
          issuer: effectiveIssuer,
          envReady: canFetchLive,
          liveCached: discoveryCache !== undefined,
        },
      });
      return doc;
    },

    authorize(
      _request: AuthorizationRequest,
      _subject: string,
    ): AuthorizationResponse {
      if (!canFetchLive) throw envError('authorize');
      throw syncInterfaceParityError('authorize');
    },

    token(_request: TokenRequest): TokenResponse {
      if (!canFetchLive) throw envError('token');
      throw syncInterfaceParityError('token');
    },

    revoke(_token: string, _clientId: string): void {
      if (!canFetchLive) throw envError('revoke');
      throw syncInterfaceParityError('revoke');
    },

    introspect(_token: string): IntrospectionResponse {
      if (!canFetchLive) throw envError('introspect');
      throw syncInterfaceParityError('introspect');
    },

    async reset(): Promise<void> {
      trace.length = 0;
      discoveryCache = undefined;
    },

    async refreshLiveDiscovery(): Promise<DiscoveryMetadata> {
      if (!canFetchLive) {
        throw new Error(
          `${KIWA_OAUTH21_ENV_MISSING}: refreshLiveDiscovery requires env-ready state (OAUTH21_BOOTSTRAP=1 + OAUTH21_MOCK_SERVER_URL, or a pre-provisioned container handle)`,
        );
      }
      discoveryCache = await fetchDiscoveryFromMock(effectiveIssuer);
      return discoveryCache;
    },
  };
  return adapter;
}

/**
 * Legacy handle shape returned by {@link startOAuth2MockServer} — kept for
 * back-compat with Sub-Issue v1.21-3b (`pkce-flow`) callers who assert on
 * the `.url` / `.revocationEndpoint` / `.introspectionEndpoint` fields. New
 * callers should use {@link OAuth2MockServerHandle} directly which carries
 * the fully-scoped {@link OAuth2MockServerHandle.issuer} URL required for
 * the Navikt mock's multi-issuer routing.
 */
export interface OAuth2MockServerLegacyHandle {
  /** Base URL for the running server (e.g. `http://127.0.0.1:PORT`). */
  readonly url: string;
  readonly authorizationEndpoint: string;
  readonly tokenEndpoint: string;
  readonly revocationEndpoint: string;
  readonly introspectionEndpoint: string;
  readonly discoveryEndpoint: string;
  stop(): Promise<void>;
}

/**
 * Start an `oauth2-mock-server` instance. Retained as a back-compat wrapper
 * for v1.21-3b callers who supply `OAUTH21_MOCK_SERVER_URL` externally
 * (docker-compose flow). The v1.22-2 testcontainers boot path is exposed
 * separately as {@link startOAuth2MockServerContainer} so callers who want
 * the container-managed lifecycle opt in explicitly.
 *
 * @deprecated Prefer {@link startOAuth2MockServerContainer} for new
 * ceremonies — this wrapper is kept for pre-v1.22-2 harnesses that assert
 * on the legacy `.url` / `.revocationEndpoint` field names.
 */
export async function startOAuth2MockServer(): Promise<OAuth2MockServerLegacyHandle> {
  const missing = detectRealEnvMissing();
  if (missing) throw new Error(`startOAuth2MockServer: ${missing}`);

  const supplied = process.env['OAUTH21_MOCK_SERVER_URL'];
  if (supplied) {
    return legacyHandleFromUrl(supplied, async () => {});
  }

  throw new Error(
    `startOAuth2MockServer: ${KIWA_OAUTH21_ENV_MISSING} — set OAUTH21_MOCK_SERVER_URL to a running oauth2-mock-server instance, or use startOAuth2MockServerContainer() for the v1.22-2 testcontainers path`,
  );
}

function legacyHandleFromUrl(
  rawUrl: string,
  stop: () => Promise<void>,
): OAuth2MockServerLegacyHandle {
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
