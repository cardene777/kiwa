/**
 * Provider-neutral OAuth 2.1 Authorization Server (AS) surface for the
 * dogfood app.
 *
 * The Hono app talks to the AS only through this interface. Two
 * implementations exist —
 *  - {@link makeMockAdapter} (backed by `@kiwa-test/auth`'s `setupOAuth21Env`
 *    + `createAuthorizationServer` — deterministic, always available)
 *  - {@link makeRealAdapter} (spawns `oauth2-mock-server` through
 *    testcontainers — skipped when `KIWA_OAUTH21_REAL_READY=1` is unset or
 *    the environment cannot run docker. Full wiring lands in Sub-Issue
 *    v1.21-3b; Sub-Issue v1.21-3a (this one) lands the env-detect skeleton
 *    so the fidelity harness can uniformly drive both adapters even when
 *    only the mock has an actual body.)
 *
 * Both must satisfy the same contract so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the release gate.
 */

import type {
  AuthorizationRequest,
  AuthorizationResponse,
  ClientRegistration,
  IntrospectionResponse,
  TokenRequest,
  TokenResponse,
} from '@kiwa-test/auth';

/**
 * Discovery metadata returned by `/.well-known/openid-configuration`.
 * RFC 8414 §2 defines the shape; OAuth 2.1 mandates `code_challenge_methods_supported`
 * includes `S256` and `grant_types_supported` excludes `implicit` and
 * `password`.
 *
 * The dogfood AS returns exactly the OAuth 2.1 mandated subset — anything
 * that would allow a downgrade attack (implicit / plain PKCE / password
 * grant) is omitted so a client reading the discovery document cannot
 * accidentally pick a forbidden flow.
 */
export interface DiscoveryMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint: string;
  introspection_endpoint: string;
  jwks_uri: string;
  response_types_supported: readonly ['code'];
  grant_types_supported: readonly ['authorization_code', 'refresh_token'];
  code_challenge_methods_supported: readonly ['S256'];
  token_endpoint_auth_methods_supported: readonly string[];
  dpop_signing_alg_values_supported: readonly ['ES256'];
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op:
    | 'discovery'
    | 'authorize'
    | 'token'
    | 'revoke'
    | 'introspect'
    | 'registerClient'
    | 'registerUser'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * OAuth 2.1 AS adapter contract. Every method maps 1:1 onto a Hono route
 * handler in `src/lib/hono-app.ts` — the route handler is a thin wrapper
 * that translates Hono `Context` to the shared method call.
 */
export interface OAuth21ASAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Register a client after env construction. The dogfood AS uses this to
   * preseed a default client per test.
   */
  registerClient(client: ClientRegistration): void;

  /**
   * Register a user after env construction. The dogfood AS uses this to
   * preseed a default user per test.
   */
  registerUser(user: { subject: string; scopes?: readonly string[] }): void;

  /**
   * Return the discovery metadata document. RFC 8414 §2 shape. Behavioural
   * fidelity axis 1 diffs the response body across mock + real.
   */
  discovery(): DiscoveryMetadata;

  /**
   * Drive an authorization request. Real deployments redirect the browser
   * to `redirectUri?code=...&state=...`; the adapter returns the parsed
   * shape so the Hono handler can build the redirect uniformly.
   *
   * `subject` mirrors what an already-authenticated session would provide —
   * the AS does not authenticate the user itself (that is the RP's job),
   * so the adapter accepts a preseeded subject id.
   */
  authorize(
    request: AuthorizationRequest,
    subject: string,
  ): AuthorizationResponse;

  /**
   * Drive a token request. Handles both `authorization_code` (with PKCE
   * verifier) and `refresh_token` (with rotation).
   */
  token(request: TokenRequest): TokenResponse;

  /**
   * Revoke a token. RFC 7009 §2.2 — revocation is idempotent, so the AS
   * MUST return 200 whether or not the token existed.
   */
  revoke(token: string, clientId: string): void;

  /**
   * Introspect a token per RFC 7662. Returns `{active: false}` for unknown
   * or revoked tokens, otherwise the token metadata.
   */
  introspect(token: string): IntrospectionResponse;

  reset(): Promise<void>;
}
