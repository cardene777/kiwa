/**
 * Provider-neutral OpenID Provider (OP) surface for the dogfood app.
 *
 * The Hono OP talks to the driver only through this interface. Two
 * implementations exist —
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/auth`'s `setupOidcEnv`.
 *    Deterministic + always available. Sub-Issue v1.21-4a wires the mock for
 *    discovery + JWKS + the OAuth 2.1 authorize / token layer already
 *    provided by the mock. DCR / id_token verify / federation land in
 *    Sub-Issues v1.21-4b / v1.21-4c / v1.21-4d.
 *  - {@link makeRealAdapter} — spawns Keycloak through testcontainers when
 *    `OIDC_BOOTSTRAP=1` is set + docker is reachable. Otherwise every
 *    method reports `KIWA_OIDC_ENV_MISSING` so tests can uniformly refuse
 *    the real driver without breaking the harness. `discovery()` returns
 *    a static shape derived from `issuer` even in the missing-env state so
 *    the fidelity harness always has a reference metadata document.
 *
 * Both must satisfy the same contract so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the release gate.
 */

import type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  JwksDocument,
  JwksKey,
  OpenIdProviderMetadata,
} from '@kiwa-test/auth';

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences (mock refuses a request but real accepts it, or
 * vice versa).
 */
export interface TraceEvent {
  op:
    | 'discovery'
    | 'jwks'
    | 'jwksRotate'
    | 'registerClient'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * OpenID Provider adapter contract. Every method maps 1:1 onto a Hono route
 * handler in `src/lib/deno-op.ts` — the route handler is a thin wrapper
 * that translates Hono `Context` to the shared method call.
 *
 * Sub-Issue v1.21-4a (this state) only requires `discovery` + `jwks` +
 * `rotateJwks` + `registerClient` stub. Later Sub-Issues extend the
 * interface with `authorize` / `token` / `signIdToken` / `verifyIdToken` /
 * `resolveTrustChain` but keep the same trace + `mode` semantics.
 */
export interface OIDCOPAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Return the discovery metadata document. OpenID Connect Discovery 1.0
   * §3. Behavioural fidelity axis 1 diffs the response body across mock +
   * real. The mock returns the shape statically derived from `issuer`; the
   * real driver returns Keycloak's realm boot-time metadata. Even in the
   * env-missing state the real driver returns a static shape so the
   * fidelity harness always has a reference.
   */
  discovery(): OpenIdProviderMetadata;

  /**
   * Return the current JWKS document. RFC 7517 §5 shape (`{keys: [...]}`).
   * Behavioural fidelity axis 3 diffs the shape across mock + real.
   */
  jwks(): JwksDocument;

  /**
   * Rotate the active JWKS signing key. Mints a fresh kid + retires the
   * previous key with a retention window so id_tokens issued under the old
   * kid stay verifiable while the window is open. Behavioural fidelity
   * axis 4 diffs the rotation semantics across mock + real.
   *
   * Returns the newly-active key so tests can assert on the fresh kid.
   */
  rotateJwks(): JwksKey;

  /**
   * Register a client through the DCR endpoint. Sub-Issue v1.21-4a stubs
   * this out at the interface level — the mock implements it (delegates to
   * the underlying `dynamicClientRegistration` helper) so downstream
   * Sub-Issues can extend the fidelity harness without changing the
   * interface. The real driver throws `KIWA_OIDC_ENV_MISSING` until
   * Sub-Issue v1.21-4b wires Keycloak `/registrations`.
   */
  registerClient(request: ClientRegistrationRequest): ClientRegistrationResponse;

  reset(): Promise<void>;
}

/**
 * Error kind emitted by adapters when the real driver runs without its
 * environment. The dogfood app + harness both check for this string so tests
 * can skip the real driver uniformly.
 */
export const KIWA_OIDC_ENV_MISSING = 'KIWA_OIDC_ENV_MISSING';
