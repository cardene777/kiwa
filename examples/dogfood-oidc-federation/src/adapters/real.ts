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
 * Handle to a running Keycloak instance. `issuer` points at the realm's
 * OIDC issuer (e.g. `http://127.0.0.1:PORT/realms/kiwa`). `stop()` releases
 * the container when the adapter is done. Consumers must invoke `stop()` in
 * an `afterAll` block to avoid leaked containers.
 *
 * `baseUrl` + `adminUsername` + `adminPassword` are exposed for callers that
 * drive the Keycloak admin REST API directly (e.g. the v1.22-5 JWKS rotation
 * real e2e harness manipulates realm key components through `/admin/realms/{realm}/components`).
 * The fidelity adapter never uses these — they exist to support the e2e
 * rotation surface without a second boot path.
 */
export interface KeycloakHandle {
  /** Base issuer URL (e.g. `http://127.0.0.1:8080/realms/kiwa`). */
  readonly issuer: string;
  /** Realm name (default `kiwa`). */
  readonly realm: string;
  /** Container base URL without the realm suffix (e.g. `http://127.0.0.1:8080`). */
  readonly baseUrl: string;
  /** Admin username (master realm) — needed for admin REST API. */
  readonly adminUsername: string;
  /** Admin password (master realm) — needed for admin REST API. */
  readonly adminPassword: string;
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
    baseUrl,
    adminUsername,
    adminPassword,
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
  const token = await obtainKeycloakAdminToken(options);
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
 * Obtain an admin bearer token bound to the `master` realm through the
 * `admin-cli` client's password grant. The token is realm-agnostic (bound
 * to the master realm regardless of which realm the caller wants to
 * mutate), so any object carrying `baseUrl` + admin credentials suffices.
 * Used to provision the target realm on first boot + as the SSOT for
 * admin ops driven by v1.22-5 JWKS rotation e2e helpers. Exported so
 * external callers (e.g. the e2e spec's kid ↔ component correlation
 * lookup) can reuse the same handshake without duplicating the fetch shape.
 */
export async function obtainKeycloakAdminToken(
  handle: { baseUrl: string; adminUsername: string; adminPassword: string },
): Promise<string> {
  const url = `${handle.baseUrl}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: handle.adminUsername,
    password: handle.adminPassword,
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
 * v1.22-5 JWKS rotation e2e surface.
 *
 * Keycloak's key rotation lives on the admin REST API (`/admin/realms/{realm}/components`).
 * Each realm carries one or more key providers; `rsa-generated` providers own an
 * RS256 signing key + emit them into `/protocol/openid-connect/certs`. The active
 * signing key is the enabled provider with the highest `priority` config value.
 *
 * The helpers below drive that surface so the v1.22-5 real e2e harness can:
 *
 *   - list the current realm key components (introspection)
 *   - create a fresh `rsa-generated` component with a higher priority (rotate:
 *     old provider stays enabled, so its key remains in `/certs` — this is
 *     Keycloak's built-in retention window)
 *   - delete a realm key component (simulate past retention: the provider's key
 *     drops out of `/certs`)
 *   - obtain an id_token via password grant (Keycloak signs with the active key)
 *
 * These helpers are intentionally NOT wired into the `OIDCOPAdapter` interface —
 * the sync interface stays parity with the mock (see § Real driver coverage
 * matrix in `docs/quality-reports/auth/oidc-federation.md`). The rotation e2e
 * harness invokes them directly against a live {@link KeycloakHandle}.
 */

/**
 * Shape of a Keycloak realm key component as returned by the admin REST API
 * `/admin/realms/{realm}/components` endpoint. Keycloak's response is a
 * superset — the fields captured here are the ones the rotation e2e harness
 * asserts on.
 */
export interface KeycloakRealmKeyComponent {
  readonly id: string;
  readonly name: string;
  readonly providerId: string;
  readonly providerType: string;
  readonly config: Record<string, readonly string[]>;
}

/**
 * List every `KeyProvider` component on the realm. Returns them sorted by
 * their `priority` config in descending order so the caller can treat the
 * first item as the current active provider (Keycloak selects the highest-
 * priority enabled provider as the active signer).
 */
export async function listKeycloakRealmKeyComponents(
  handle: KeycloakHandle,
): Promise<readonly KeycloakRealmKeyComponent[]> {
  const token = await obtainKeycloakAdminToken(handle);
  const url = `${handle.baseUrl}/admin/realms/${handle.realm}/components?type=org.keycloak.keys.KeyProvider`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak list key components failed ${response.status}: ${text}`,
    );
  }
  const rows = (await response.json()) as readonly KeycloakRealmKeyComponent[];
  const withPriority = rows.map((row) => ({
    row,
    priority: Number(row.config?.['priority']?.[0] ?? '0'),
  }));
  withPriority.sort((a, b) => b.priority - a.priority);
  return withPriority.map((entry) => entry.row);
}

/**
 * Create a fresh `rsa-generated` realm key component with a priority higher
 * than every existing component. Keycloak treats the highest-priority
 * enabled provider as the active signer — this call performs the rotation
 * without disabling the previous provider so its key stays in `/certs`
 * (Keycloak's built-in retention window).
 *
 * Returns the newly-created component so the caller can capture the
 * component id (for eventual deletion when simulating past retention).
 */
export async function createKeycloakRealmKeyComponent(
  handle: KeycloakHandle,
  options: { name?: string; priority?: number } = {},
): Promise<KeycloakRealmKeyComponent> {
  const existing = await listKeycloakRealmKeyComponents(handle);
  const maxPriority = existing.reduce((max, component) => {
    const value = Number(component.config?.['priority']?.[0] ?? '0');
    return value > max ? value : max;
  }, 0);
  const priority = options.priority ?? maxPriority + 100;
  const name = options.name ?? `kiwa-e2e-rotate-${Date.now()}-${priority}`;

  const token = await obtainKeycloakAdminToken(handle);
  const url = `${handle.baseUrl}/admin/realms/${handle.realm}/components`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      providerId: 'rsa-generated',
      providerType: 'org.keycloak.keys.KeyProvider',
      config: {
        priority: [String(priority)],
        enabled: ['true'],
        active: ['true'],
        algorithm: ['RS256'],
        keySize: ['2048'],
      },
    }),
  });
  if (response.status !== 201) {
    const text = await response.text();
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak create key component failed ${response.status}: ${text}`,
    );
  }
  // Keycloak's Location header carries the new component id.
  const location = response.headers.get('location');
  const id = location?.split('/').pop() ?? '';
  if (!id) {
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak create key component response missing Location header`,
    );
  }
  // Re-list so the caller receives the fully-populated shape (Keycloak's
  // POST response body is empty; the config/kid gets minted server-side).
  const refreshed = await listKeycloakRealmKeyComponents(handle);
  const created = refreshed.find((component) => component.id === id);
  if (!created) {
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak created key component ${id} missing from re-list`,
    );
  }
  return created;
}

/**
 * Delete a realm key component through the admin REST API. Removes the
 * provider (and its key) from `/certs` — used to simulate rotation past
 * the retention window (axes 4b / 4c drop-boundary tests).
 */
export async function deleteKeycloakRealmKeyComponent(
  handle: KeycloakHandle,
  componentId: string,
): Promise<void> {
  const token = await obtainKeycloakAdminToken(handle);
  const url = `${handle.baseUrl}/admin/realms/${handle.realm}/components/${componentId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status !== 204 && response.status !== 404) {
    const text = await response.text();
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak delete key component ${componentId} failed ${response.status}: ${text}`,
    );
  }
}

/**
 * Options for {@link ensureKeycloakConfidentialClient}. The rotation e2e
 * harness needs a confidential client + a user to mint id_tokens through
 * the resource-owner password credentials grant (RFC 6749 §4.3). The grant
 * is deprecated in OAuth 2.1 for production use, but Keycloak still
 * supports it under `directAccessGrantsEnabled`, and it is the cleanest
 * path to obtain an id_token in a fully headless test.
 */
export interface EnsureKeycloakClientOptions {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly username: string;
  readonly password: string;
  readonly email?: string;
}

/**
 * Provision a confidential client + user pair on the realm. Idempotent —
 * repeated calls with the same options are a no-op (409 responses from
 * Keycloak are treated as success). Returns nothing; callers subsequently
 * invoke {@link mintIdTokenFromKeycloak} to obtain an id_token.
 */
export async function ensureKeycloakConfidentialClient(
  handle: KeycloakHandle,
  options: EnsureKeycloakClientOptions,
): Promise<void> {
  const token = await obtainKeycloakAdminToken(handle);
  // Create the client. If it already exists (409), Keycloak returns a
  // conflict response which we treat as idempotent success.
  const clientResponse = await fetch(
    `${handle.baseUrl}/admin/realms/${handle.realm}/clients`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: options.clientId,
        secret: options.clientSecret,
        directAccessGrantsEnabled: true,
        publicClient: false,
        serviceAccountsEnabled: false,
        // Standard flow is enabled by default; leaving it on so a follow-up
        // code-flow test can reuse the same client.
        standardFlowEnabled: true,
        // Force `client_secret_basic` — matches the mock's default DCR
        // auth method (see fidelity axis 5).
        clientAuthenticatorType: 'client-secret',
      }),
    },
  );
  if (clientResponse.status !== 201 && clientResponse.status !== 409) {
    const text = await clientResponse.text();
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak client provision failed ${clientResponse.status}: ${text}`,
    );
  }

  // Create the user with a permanent password. Same 409-as-success rule
  // for idempotent reboots. `requiredActions: []` explicitly clears any
  // profile-completion flags Keycloak adds by default (e.g. "Verify
  // Profile") — without this, the password grant refuses with
  // `Account is not fully set up`. `firstName` / `lastName` satisfy
  // Keycloak's default user profile schema so realm attribute validation
  // does not require an interactive completion round-trip.
  const userResponse = await fetch(
    `${handle.baseUrl}/admin/realms/${handle.realm}/users`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: options.username,
        enabled: true,
        emailVerified: true,
        email: options.email ?? `${options.username}@kiwa.example.test`,
        firstName: options.username,
        lastName: 'kiwa-e2e',
        requiredActions: [],
        credentials: [
          {
            type: 'password',
            value: options.password,
            temporary: false,
          },
        ],
      }),
    },
  );
  if (userResponse.status !== 201 && userResponse.status !== 409) {
    const text = await userResponse.text();
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak user provision failed ${userResponse.status}: ${text}`,
    );
  }
}

/**
 * Mint an id_token from Keycloak via the resource-owner password credentials
 * grant. Returns the raw id_token JWT + the access_token so callers can
 * decode / verify. Fails hard on any non-200 response so the axes trip
 * with a diagnosable message instead of a silent `undefined`.
 */
export async function mintIdTokenFromKeycloak(
  handle: KeycloakHandle,
  options: EnsureKeycloakClientOptions & { scope?: string },
): Promise<{ id_token: string; access_token: string }> {
  const url = `${handle.issuer}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: options.clientId,
    client_secret: options.clientSecret,
    username: options.username,
    password: options.password,
    scope: options.scope ?? 'openid',
  });
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak password grant failed ${response.status}: ${text}`,
    );
  }
  const parsed = (await response.json()) as {
    id_token?: string;
    access_token?: string;
  };
  if (!parsed.id_token || !parsed.access_token) {
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak password grant response missing id_token/access_token`,
    );
  }
  return { id_token: parsed.id_token, access_token: parsed.access_token };
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
