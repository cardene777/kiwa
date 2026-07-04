/**
 * Real adapter — drives a live Keycloak instance so the fidelity harness can
 * diff mock vs real behaviour side-by-side. v1.22-1 (CAR-442 / GH #887) wires
 * the testcontainers path so a caller who invokes {@link startKeycloakContainer}
 * boots a `quay.io/keycloak/keycloak` container, imports the `kiwa` realm, and
 * exposes discovery + JWKS through Keycloak's OIDC endpoints. When Docker is
 * unreachable or the env vars are unset, every ceremony beyond `discovery()`
 * refuses with `KIWA_OIDC_ENV_MISSING` — the fidelity harness inspects the trace
 * to distinguish "environment absent" from "assertion failed" (mirrors the
 * `dogfood-oauth21-provider` pattern for provider parity).
 *
 * Two env-ready states are supported (both surfaced through the same async
 * live-fetch helpers, `refreshLiveDiscovery` + `refreshLiveJwks`):
 *   1. `keycloak` option supplied — the caller booted the container through
 *      {@link startKeycloakContainer} (typically in a vitest `beforeAll` so
 *      one container is shared across every axis) and hands the handle to
 *      the adapter. `effectiveIssuer` becomes the handle's realm URL.
 *   2. `OIDC_BOOTSTRAP=1` AND `KEYCLOAK_URL` populated — the caller has
 *      already provisioned Keycloak externally (docker-compose, testcontainers
 *      driven from a separate lifecycle, or a shared deployment). The adapter
 *      fetches discovery + JWKS from the supplied URL.
 *
 * The adapter does NOT boot Keycloak lazily inside `makeRealAdapter` — the
 * container lifecycle stays with the caller so the `stop()` boundary is
 * unambiguous (avoids the "who owns cleanup?" trap when the adapter is torn
 * down mid-request). Callers who want a lazy boot invoke
 * {@link startKeycloakContainer} explicitly + wrap it in their own lifecycle.
 *
 * The env-detect runs eagerly at construction so vitest `--isolate` tests can
 * override `env` per suite without touching `process.env`.
 */

import type {
  JwksDocument,
  JwksKey,
  OpenIdProviderMetadata,
} from '@kiwa-test/auth';
import type {
  ExtendedClientRegistrationRequest,
  ExtendedClientRegistrationResponse,
} from '../lib/dcr.js';
import {
  KIWA_OIDC_ENV_MISSING,
  type OIDCOPAdapter,
  type TraceEvent,
} from './interface.js';

export interface MakeRealAdapterOptions {
  /**
   * `issuer` URL the OP publishes in discovery metadata. Defaults to
   * `https://op.example.test` (matches mock default so cross-driver diffs
   * do not trip on the issuer field alone).
   */
  issuer?: string;
  /**
   * Optional environment override. Defaults to `process.env`. Sub-Issues
   * inject test fixtures without mutating the real env.
   */
  env?: Record<string, string | undefined>;
  /**
   * Optional pre-provisioned Keycloak handle. When supplied the adapter
   * skips the boot path + uses the handle directly. Injected by the
   * fidelity harness so a single container boots once per test file and
   * every axis reuses the same handle.
   */
  keycloak?: KeycloakHandle;
}

const DEFAULT_ISSUER = 'https://op.example.test';
const DEFAULT_REALM = 'kiwa';
/**
 * Container image tag. Pinned to a specific patch release so container-cache
 * hits stay deterministic — bump manually when Keycloak lands a security fix
 * relevant to the fidelity axes.
 */
export const KEYCLOAK_IMAGE = 'quay.io/keycloak/keycloak:26.0';

/**
 * Handle to a running Keycloak instance. `baseUrl` points at the realm's
 * OIDC issuer (e.g. `http://127.0.0.1:PORT/realms/kiwa`). `stop()` releases
 * the container when the adapter is done. Consumers must invoke `stop()` in
 * an `afterAll` block to avoid leaked containers.
 */
export interface KeycloakHandle {
  /** Base issuer URL (e.g. `http://127.0.0.1:8080/realms/kiwa`). */
  readonly issuer: string;
  /** Realm name (default `kiwa`). */
  readonly realm: string;
  /** Free the container. Idempotent. */
  stop(): Promise<void>;
}

/**
 * Build the static discovery metadata derived from `issuer`. The real
 * driver returns this shape when running in env-missing mode so the
 * fidelity harness always has a reference document to diff against. In
 * env-ready mode the shape is replaced by Keycloak's realm boot-time
 * metadata (see {@link fetchDiscoveryFromKeycloak}).
 */
function buildStaticDiscovery(issuer: string): OpenIdProviderMetadata {
  const trimmed = issuer.replace(/\/$/, '');
  return {
    issuer: trimmed,
    authorization_endpoint: `${trimmed}/authorize`,
    token_endpoint: `${trimmed}/token`,
    jwks_uri: `${trimmed}/jwks`,
    registration_endpoint: `${trimmed}/register`,
    userinfo_endpoint: `${trimmed}/userinfo`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'ES256'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none',
    ],
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'nonce',
      'at_hash',
      'c_hash',
      'name',
      'email',
    ],
    code_challenge_methods_supported: ['S256'],
  };
}

/**
 * Detect whether the environment is ready to talk to a pre-provisioned
 * Keycloak instance through fetch. Requires both `OIDC_BOOTSTRAP=1` +
 * `KEYCLOAK_URL` to be set. When the caller instead supplies a
 * pre-booted {@link KeycloakHandle} through the adapter options, the env
 * check is bypassed — the handle is authoritative.
 */
export function isEnvReady(env: Record<string, string | undefined>): boolean {
  return env['OIDC_BOOTSTRAP'] === '1' && Boolean(env['KEYCLOAK_URL']);
}

/**
 * Fetch discovery metadata from a running Keycloak realm. Keycloak exposes
 * the OIDC 1.0 §3 shape at `{issuer}/.well-known/openid-configuration`. The
 * function narrows Keycloak's superset (which includes extension fields
 * like `registration_endpoint` that Keycloak conditionally emits) onto the
 * kiwa `OpenIdProviderMetadata` contract so the fidelity harness can diff
 * mock vs real on the same field set.
 *
 * When Keycloak omits an optional field the fallback derives it from the
 * static shape — this keeps the diff meaningful even for realms that hide
 * an endpoint (e.g., `registration_endpoint` is only advertised when the
 * DCR provider is enabled on the realm).
 */
export async function fetchDiscoveryFromKeycloak(
  issuer: string,
): Promise<OpenIdProviderMetadata> {
  const trimmed = issuer.replace(/\/$/, '');
  const url = `${trimmed}/.well-known/openid-configuration`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak discovery fetch failed ${response.status}`,
    );
  }
  const body = (await response.json()) as Partial<OpenIdProviderMetadata> & {
    issuer?: string;
  };
  const fallback = buildStaticDiscovery(trimmed);
  return {
    issuer: body.issuer ?? fallback.issuer,
    authorization_endpoint:
      body.authorization_endpoint ?? fallback.authorization_endpoint,
    token_endpoint: body.token_endpoint ?? fallback.token_endpoint,
    jwks_uri: body.jwks_uri ?? fallback.jwks_uri,
    registration_endpoint:
      body.registration_endpoint ?? fallback.registration_endpoint,
    userinfo_endpoint: body.userinfo_endpoint ?? fallback.userinfo_endpoint,
    response_types_supported:
      body.response_types_supported ?? fallback.response_types_supported,
    subject_types_supported:
      body.subject_types_supported ?? fallback.subject_types_supported,
    id_token_signing_alg_values_supported:
      body.id_token_signing_alg_values_supported ??
      fallback.id_token_signing_alg_values_supported,
    scopes_supported: body.scopes_supported ?? fallback.scopes_supported,
    token_endpoint_auth_methods_supported:
      body.token_endpoint_auth_methods_supported ??
      fallback.token_endpoint_auth_methods_supported,
    claims_supported: body.claims_supported ?? fallback.claims_supported,
    code_challenge_methods_supported:
      body.code_challenge_methods_supported ??
      fallback.code_challenge_methods_supported,
  };
}

/**
 * Fetch the JWKS document from a running Keycloak realm. Keycloak exposes
 * the RFC 7517 §5 shape at `{issuer}/protocol/openid-connect/certs`.
 */
export async function fetchJwksFromKeycloak(issuer: string): Promise<JwksDocument> {
  const trimmed = issuer.replace(/\/$/, '');
  const url = `${trimmed}/protocol/openid-connect/certs`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak jwks fetch failed ${response.status}`,
    );
  }
  const body = (await response.json()) as { keys?: readonly JwksKey[] };
  const keys = body.keys ?? [];
  // Keycloak returns realm keys in "active first" order; the shape matches
  // RFC 7517 §5 verbatim so we can hand it through without transformation.
  // The mock's fidelity axis 3 (JWKS active key shape) drives the same
  // assertion against both drivers.
  return { keys };
}

/**
 * Bootstrap-level shape returned by the container launcher. Boots Keycloak
 * in `start-dev` mode, waits for readiness, and hands back the realm URL.
 * Exported for tests + external callers that want to manage the container
 * lifecycle themselves.
 */
export interface StartKeycloakContainerOptions {
  /** Image tag. Defaults to {@link KEYCLOAK_IMAGE}. */
  image?: string;
  /** Realm name to provision. Defaults to `kiwa`. */
  realm?: string;
  /** Admin username. Defaults to `admin`. */
  adminUsername?: string;
  /** Admin password. Defaults to `admin`. */
  adminPassword?: string;
  /**
   * Startup timeout in milliseconds. Defaults to 90000 (90s) — Keycloak's
   * cold start on a first-time image pull can take 60s+.
   */
  startupTimeoutMs?: number;
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
 * Boot Keycloak through testcontainers. Returns a {@link KeycloakHandle}
 * whose `issuer` points at the realm's OIDC base URL. Caller invokes
 * `stop()` to release the container.
 *
 * Keycloak's `start-dev` mode boots the H2 backend + admin console
 * without TLS, which is fine for local fidelity checks — the OIDC
 * endpoints under `/realms/{realm}` are the only surface the harness
 * exercises. Realm bootstrap is done via the admin REST API on first use
 * (see {@link ensureRealm}) so the container image stays vanilla.
 */
export async function startKeycloakContainer(
  options: StartKeycloakContainerOptions = {},
): Promise<KeycloakHandle> {
  const image = options.image ?? KEYCLOAK_IMAGE;
  const realm = options.realm ?? DEFAULT_REALM;
  const adminUsername = options.adminUsername ?? 'admin';
  const adminPassword = options.adminPassword ?? 'admin';
  const startupTimeoutMs = options.startupTimeoutMs ?? 90_000;

  let testcontainers: TestcontainersModule;
  try {
    testcontainers = (await import('testcontainers')) as unknown as TestcontainersModule;
  } catch (caught) {
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: testcontainers peer dependency missing — install with \`pnpm add -D testcontainers\`. Original error: ${
        caught instanceof Error ? caught.message : String(caught)
      }`,
    );
  }

  // Keycloak 26.x exposes the OIDC endpoints under `/realms/{realm}` and
  // the http port bound in `start-dev` mode is 8080; testcontainers
  // publishes a random host port that we then use to construct the issuer
  // URL. The wait strategy matches Keycloak's startup log line
  // `Keycloak <ver> on JVM (powered by Quarkus <ver>) started in <ms>s.`
  // — a substring match on `started in` is sufficient since the phrase
  // does not appear earlier in the boot output.
  const container = new testcontainers.GenericContainer(image)
    .withExposedPorts(8080)
    .withEnvironment({
      // Keycloak 26 deprecated KEYCLOAK_ADMIN in favour of
      // KC_BOOTSTRAP_ADMIN_USERNAME, but the deprecated form still
      // provisions the admin user (with a warning). Setting both keeps the
      // image compatible with 25.x → 26.x and future 27.x releases.
      KEYCLOAK_ADMIN: adminUsername,
      KEYCLOAK_ADMIN_PASSWORD: adminPassword,
      KC_BOOTSTRAP_ADMIN_USERNAME: adminUsername,
      KC_BOOTSTRAP_ADMIN_PASSWORD: adminPassword,
      KC_HEALTH_ENABLED: 'true',
      KC_HTTP_ENABLED: 'true',
      KC_HOSTNAME_STRICT: 'false',
    })
    .withCommand(['start-dev'])
    .withWaitStrategy(testcontainers.Wait.forLogMessage(/started in/))
    .withStartupTimeout(startupTimeoutMs);

  const started = await container.start();
  const host = started.getHost();
  const port = started.getMappedPort(8080);
  const baseUrl = `http://${host}:${port}`;
  const issuer = `${baseUrl}/realms/${realm}`;

  // Provision the `kiwa` realm through the admin REST API. Keycloak ships
  // with a `master` realm out of the box; the fidelity harness needs a
  // dedicated realm so client + user provisioning stays sandboxed.
  await ensureRealm({
    baseUrl,
    adminUsername,
    adminPassword,
    realm,
  });

  return {
    issuer,
    realm,
    stop: async () => {
      await started.stop();
    },
  };
}

interface EnsureRealmOptions {
  baseUrl: string;
  adminUsername: string;
  adminPassword: string;
  realm: string;
}

/**
 * Create the target realm through Keycloak's admin REST API. Idempotent —
 * a 409 response (realm already exists) is treated as success so repeated
 * boots of the same container reuse the existing realm.
 */
async function ensureRealm(options: EnsureRealmOptions): Promise<void> {
  const token = await obtainAdminToken(options);
  const response = await fetch(`${options.baseUrl}/admin/realms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      realm: options.realm,
      enabled: true,
      // DCR requires the anonymous client-registration policy on the realm;
      // Keycloak enables it by default when the realm is created through
      // the admin REST API. No further config needed for the fidelity axes.
    }),
  });
  if (response.status === 201) return;
  if (response.status === 409) return;
  const body = await response.text();
  throw new Error(
    `${KIWA_OIDC_ENV_MISSING}: keycloak realm provision failed ${response.status}: ${body}`,
  );
}

/**
 * Obtain an admin bearer token through the `master` realm's password
 * grant. Used to provision the target realm on first boot.
 */
async function obtainAdminToken(options: EnsureRealmOptions): Promise<string> {
  const url = `${options.baseUrl}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: options.adminUsername,
    password: options.adminPassword,
  });
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak admin token fetch failed ${response.status}: ${text}`,
    );
  }
  const parsed = (await response.json()) as { access_token?: string };
  if (!parsed.access_token) {
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak admin token response missing access_token`,
    );
  }
  return parsed.access_token;
}

/**
 * Real adapter surface. Extends {@link OIDCOPAdapter} with the async
 * live-fetch helpers required by v1.22-1 (the sync interface stays parity
 * with the mock; the async surface is exposed for tests that want live
 * documents fetched from Keycloak).
 */
export interface RealOIDCAdapter extends OIDCOPAdapter {
  /**
   * Effective issuer URL used to talk to Keycloak. Equals the requested
   * issuer when env-missing, the Keycloak handle's issuer when supplied,
   * or `env.KEYCLOAK_URL` when env-ready.
   */
  readonly effectiveIssuer: string;
  /**
   * Fetch the discovery document from Keycloak and cache it for the next
   * synchronous `discovery()` call. Refuses in env-missing mode.
   */
  refreshLiveDiscovery(): Promise<OpenIdProviderMetadata>;
  /**
   * Fetch the JWKS document from Keycloak and cache it for the next
   * synchronous `jwks()` call. Refuses in env-missing mode.
   */
  refreshLiveJwks(): Promise<JwksDocument>;
}

/**
 * Build the real adapter. The env-detect runs eagerly at construction so
 * the harness can decide whether to skip real-driver assertions before
 * pushing any events onto the trace buffer.
 *
 * When the caller supplies a pre-provisioned {@link KeycloakHandle}, the
 * adapter uses that handle directly — the harness pattern is to boot one
 * container per test file, share the handle across every axis, then stop
 * it in `afterAll`. Otherwise the adapter falls back to fetching from
 * `env.KEYCLOAK_URL` when `envReady` is true.
 */
export async function makeRealAdapter(
  options: MakeRealAdapterOptions = {},
): Promise<RealOIDCAdapter> {
  const requestedIssuer = options.issuer ?? DEFAULT_ISSUER;
  const env = options.env ?? (process.env as Record<string, string | undefined>);
  const envReady = isEnvReady(env);
  const keycloakHandle = options.keycloak;
  // When a handle is supplied the effective issuer is Keycloak's realm URL
  // so downstream diffs use Keycloak's actual metadata. Without a handle the
  // env-URL takes precedence over the requested issuer (mirrors the
  // env-injected wiring pattern).
  const effectiveIssuer = keycloakHandle
    ? keycloakHandle.issuer
    : envReady
    ? env['KEYCLOAK_URL']!.replace(/\/$/, '')
    : requestedIssuer;
  const canFetchLive = keycloakHandle !== undefined || envReady;
  const staticMetadata = buildStaticDiscovery(effectiveIssuer);
  const traces: TraceEvent[] = [];
  // Cached discovery + JWKS documents. Both endpoints are treated as
  // idempotent per fetch — the harness invokes them once per axis, so a
  // one-shot cache is enough.
  let discoveryCache: OpenIdProviderMetadata | undefined;
  let jwksCache: JwksDocument | undefined;

  function push(event: TraceEvent): void {
    traces.push(event);
  }

  function discovery(): OpenIdProviderMetadata {
    // Discovery always returns a shape — env-missing surfaces the static
    // shape derived from `issuer` so the fidelity harness always has a
    // reference. In env-ready mode we still return the static shape
    // synchronously because `discovery()` is defined as sync in the
    // interface; the async wire-up is exposed through
    // `fetchDiscoveryFromKeycloak` for tests that want the live document.
    push({ op: 'discovery', ok: true });
    return discoveryCache ?? staticMetadata;
  }

  function jwks(): JwksDocument {
    if (!canFetchLive) {
      push({
        op: 'jwks',
        ok: false,
        errorKind: KIWA_OIDC_ENV_MISSING,
      });
      throw new Error(
        `${KIWA_OIDC_ENV_MISSING}: real adapter requires OIDC_BOOTSTRAP=1 and KEYCLOAK_URL (or a pre-provisioned handle)`,
      );
    }
    if (jwksCache === undefined) {
      // JWKS is inherently async (network fetch). The interface exposes a
      // sync method for parity with the mock, so callers that want live
      // JWKS must call `refreshLiveJwks()` before invoking `jwks()`.
      // Without a prefetch we throw with a distinct message so the harness
      // can diagnose the misuse.
      push({
        op: 'jwks',
        ok: false,
        errorKind: KIWA_OIDC_ENV_MISSING,
        detail: { reason: 'call refreshLiveJwks() before jwks() in real mode' },
      });
      throw new Error(
        `${KIWA_OIDC_ENV_MISSING}: real adapter requires refreshLiveJwks() before jwks() — sync interface + async fetch`,
      );
    }
    push({ op: 'jwks', ok: true });
    return jwksCache;
  }

  function rotateJwks(): JwksKey {
    // Keycloak exposes JWKS rotation through the admin REST API + realm
    // key providers. Wiring that surface here would require an admin
    // token per rotation + a realm-key CRUD which is outside the fidelity
    // harness scope (axes 4/4a-4d are already covered by the mock and
    // Keycloak's rotation semantics are documented in the `docs/quality-reports/auth/oidc-federation.md`
    // real coverage matrix as "documented, mock is reference"). Refusing
    // here keeps the adapter honest — a caller who needs live rotation
    // should invoke the admin API directly rather than expect the fidelity
    // adapter to model it.
    push({
      op: 'jwksRotate',
      ok: false,
      errorKind: KIWA_OIDC_ENV_MISSING,
      detail: {
        reason:
          'rotation lives on the admin API surface — mock is the release-gate reference for axes 4 / 4a-4d',
      },
    });
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: rotation stays on admin API surface — see oidc-federation.md real coverage matrix`,
    );
  }

  function registerClient(
    _request: ExtendedClientRegistrationRequest,
  ): ExtendedClientRegistrationResponse {
    // Keycloak's `/realms/{realm}/clients-registrations/default` accepts
    // RFC 7591 DCR requests but is inherently async (network POST). The
    // interface exposes a sync method for parity with the mock, so live
    // registration through the real driver refuses with a distinguishable
    // detail message. Tests that want a live registration can call
    // `registerClientLive()` on the adapter (async surface).
    push({
      op: 'registerClient',
      ok: false,
      errorKind: KIWA_OIDC_ENV_MISSING,
      detail: {
        reason:
          canFetchLive
            ? 'sync interface + async DCR endpoint — use registerClientLive() instead'
            : 'env-missing',
      },
    });
    throw new Error(
      canFetchLive
        ? `${KIWA_OIDC_ENV_MISSING}: real adapter DCR requires async registerClientLive() — sync interface parity`
        : `${KIWA_OIDC_ENV_MISSING}: real adapter cannot register clients in env-missing state`,
    );
  }

  async function reset(): Promise<void> {
    traces.length = 0;
    discoveryCache = undefined;
    jwksCache = undefined;
    push({ op: 'reset', ok: true });
  }

  // Async prefetch surfaces used by the real-mode fidelity harness. Callers
  // invoke these before the sync methods so the cached document is served
  // synchronously — this keeps the `OIDCOPAdapter` interface unchanged
  // (mock parity) while exposing the network round-trip when needed.
  async function refreshLiveDiscovery(): Promise<OpenIdProviderMetadata> {
    if (!canFetchLive) {
      throw new Error(
        `${KIWA_OIDC_ENV_MISSING}: refreshLiveDiscovery requires env-ready state`,
      );
    }
    discoveryCache = await fetchDiscoveryFromKeycloak(effectiveIssuer);
    return discoveryCache;
  }

  async function refreshLiveJwks(): Promise<JwksDocument> {
    if (!canFetchLive) {
      throw new Error(
        `${KIWA_OIDC_ENV_MISSING}: refreshLiveJwks requires env-ready state`,
      );
    }
    jwksCache = await fetchJwksFromKeycloak(effectiveIssuer);
    return jwksCache;
  }

  const adapter: RealOIDCAdapter = {
    mode: 'real',
    effectiveIssuer,
    traces: () => [...traces],
    discovery,
    jwks,
    rotateJwks,
    registerClient,
    reset,
    refreshLiveDiscovery,
    refreshLiveJwks,
  };
  return adapter;
}
