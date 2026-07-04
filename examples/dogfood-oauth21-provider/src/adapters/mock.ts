/**
 * Mock adapter — drives `@kiwa-test/auth`'s `setupOAuth21Env` +
 * `createAuthorizationServer` so the same Hono app exercises a
 * deterministic OAuth 2.1 flow without spawning `oauth2-mock-server` or a
 * docker container. Both mock and real adapters satisfy
 * {@link OAuth21ASAdapter}, so the fidelity harness can diff them
 * side-by-side.
 *
 * The mock preseeds no clients / users by default — callers pass
 * `{clients, users}` to {@link makeMockAdapter} or invoke
 * `registerClient` / `registerUser` after the env is built. Every method
 * appends a trace event so downstream tests can assert on the AS's
 * behavioural sequence.
 */

import {
  setupOAuth21Env,
  __resetOAuth21Counters,
  type AuthorizationRequest,
  type AuthorizationResponse,
  type ClientRegistration,
  type IntrospectionResponse,
  type OAuth21TestEnv,
  type TokenRequest,
  type TokenResponse,
} from '@kiwa-test/auth';
import type {
  DiscoveryMetadata,
  OAuth21ASAdapter,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /**
   * `issuer` URL the AS publishes in discovery metadata. Defaults to
   * `https://as.example.test` to mirror the underlying kiwa mock default.
   */
  issuer?: string;
  /**
   * Access token lifetime in seconds. Default 3600.
   */
  accessTokenLifetimeSec?: number;
  /**
   * Refresh token lifetime in seconds. Default 86400.
   */
  refreshTokenLifetimeSec?: number;
  /**
   * DPoP proof `iat` skew tolerance in seconds. Default 60 (RFC 9449 §4.3).
   */
  dpopIatSkewSec?: number;
  /**
   * Deterministic clock. When omitted the mock uses `Date.now()`.
   */
  now?: () => number;
  /**
   * Optional preseeded clients. Passed straight to
   * `createAuthorizationServer` for hermetic tests.
   */
  clients?: readonly ClientRegistration[];
  /**
   * Optional preseeded users. Passed straight to
   * `createAuthorizationServer`.
   */
  users?: readonly { subject: string; scopes?: readonly string[] }[];
}

const DEFAULT_ISSUER = 'https://as.example.test';

/**
 * Map an AS rejection to a stable trace `errorKind`. The mock throws with
 * message prefixes like `authorize:` / `token:` — the classifier pulls a
 * short kebab-case tag so tests can assert on the errorKind without
 * scraping the message.
 */
function classifyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  // OAuth 2.1 hardening — implicit + password + client_credentials refuse.
  if (message.includes('response_type') && message.includes('refused')) {
    return 'unsupported_response_type';
  }
  if (message.includes('code_challenge_method "plain"')) return 'plain_pkce_refused';
  if (message.includes('unknown code_challenge_method')) return 'unknown_pkce_method';
  if (message.includes('code_challenge missing')) return 'missing_code_challenge';
  if (message.includes('state parameter missing')) return 'missing_state';
  if (message.includes('grant_type') && message.includes('refused')) {
    return 'unsupported_grant_type';
  }
  if (message.includes('unknown grant_type')) return 'unknown_grant_type';
  // Client + user lookup failures.
  if (message.includes('unknown client_id')) return 'unknown_client';
  if (message.includes('unknown subject')) return 'unknown_subject';
  if (message.includes('redirect_uri') && message.includes('not registered')) {
    return 'redirect_uri_mismatch';
  }
  // Token exchange failures.
  if (message.includes('unknown authorization code')) return 'unknown_code';
  if (message.includes('already exchanged')) return 'code_replay_refused';
  if (message.includes('client_id mismatch')) return 'client_id_mismatch';
  if (message.includes('redirect_uri mismatch')) return 'redirect_uri_mismatch';
  if (message.includes('PKCE code_verifier does not match')) return 'pkce_verifier_mismatch';
  if (message.includes('DPoP')) return 'dpop_proof_invalid';
  if (message.includes('refresh_token')) return 'invalid_refresh_token';
  return 'as_error';
}

/**
 * Build the discovery metadata document from the AS issuer. The dogfood
 * AS advertises exactly the OAuth 2.1 mandated subset — `implicit`,
 * `plain` PKCE and `password` grant are omitted so a downgrade attack
 * cannot pass discovery inspection.
 */
export function buildDiscovery(issuer: string): DiscoveryMetadata {
  return {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    revocation_endpoint: `${issuer}/revoke`,
    introspection_endpoint: `${issuer}/introspect`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ['code'] as const,
    grant_types_supported: ['authorization_code', 'refresh_token'] as const,
    code_challenge_methods_supported: ['S256'] as const,
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none',
    ],
    dpop_signing_alg_values_supported: ['ES256'] as const,
  };
}

/**
 * Build a mock adapter with a pre-provisioned kiwa env. The adapter is
 * synchronous after this call — all method calls delegate to the
 * `env.server` handle directly.
 *
 * Test authors pass `clients` + `users` via {@link MakeMockAdapterOptions}
 * to preseed the AS hermetically. Every method appends a trace event.
 */
export async function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): Promise<
  OAuth21ASAdapter & {
    /** Escape hatch for tests that need to inspect the raw kiwa env. */
    readonly env: () => OAuth21TestEnv;
  }
> {
  const trace: TraceEvent[] = [];
  const issuer = opts.issuer ?? DEFAULT_ISSUER;
  // Reset the module-scope counters so consecutive `makeMockAdapter`
  // calls in the same process produce stable ids — mirrors the pattern
  // the WebAuthn dogfood adapter uses (`__resetWebAuthnCounters` in
  // `beforeEach`).
  __resetOAuth21Counters();
  const setupOpts: Parameters<typeof setupOAuth21Env>[0] = { issuer };
  if (opts.accessTokenLifetimeSec !== undefined) {
    setupOpts.accessTokenLifetimeSec = opts.accessTokenLifetimeSec;
  }
  if (opts.refreshTokenLifetimeSec !== undefined) {
    setupOpts.refreshTokenLifetimeSec = opts.refreshTokenLifetimeSec;
  }
  if (opts.dpopIatSkewSec !== undefined) {
    setupOpts.dpopIatSkewSec = opts.dpopIatSkewSec;
  }
  if (opts.now !== undefined) setupOpts.now = opts.now;
  if (opts.clients !== undefined) setupOpts.clients = opts.clients;
  if (opts.users !== undefined) setupOpts.users = opts.users;
  const env: OAuth21TestEnv = await setupOAuth21Env(setupOpts);

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],
    env: () => env,

    registerClient(client: ClientRegistration): void {
      try {
        env.server.registerClient(client);
        record('registerClient', true, { detail: { clientId: client.clientId } });
      } catch (err) {
        const errorKind = classifyError(err);
        record('registerClient', false, { errorKind });
        throw err;
      }
    },

    registerUser(user: { subject: string; scopes?: readonly string[] }): void {
      try {
        env.server.registerUser(user);
        record('registerUser', true, { detail: { subject: user.subject } });
      } catch (err) {
        const errorKind = classifyError(err);
        record('registerUser', false, { errorKind });
        throw err;
      }
    },

    discovery(): DiscoveryMetadata {
      const doc = buildDiscovery(issuer);
      record('discovery', true, { detail: { issuer } });
      return doc;
    },

    authorize(
      request: AuthorizationRequest,
      subject: string,
    ): AuthorizationResponse {
      try {
        const response = env.server.authorize(request, subject);
        record('authorize', true, {
          detail: {
            clientId: request.clientId,
            responseType: request.responseType,
            hasChallenge: Boolean(request.codeChallenge),
          },
        });
        return response;
      } catch (err) {
        const errorKind = classifyError(err);
        record('authorize', false, { errorKind });
        throw err;
      }
    },

    token(request: TokenRequest): TokenResponse {
      try {
        const response = env.server.token(request);
        record('token', true, {
          detail: {
            grantType: request.grantType,
            tokenType: response.tokenType,
          },
        });
        return response;
      } catch (err) {
        const errorKind = classifyError(err);
        record('token', false, { errorKind });
        throw err;
      }
    },

    revoke(token: string, clientId: string): void {
      try {
        env.server.revoke(token, clientId);
        record('revoke', true, { detail: { clientId } });
      } catch (err) {
        const errorKind = classifyError(err);
        record('revoke', false, { errorKind });
        throw err;
      }
    },

    introspect(token: string): IntrospectionResponse {
      try {
        const response = env.server.introspect(token);
        record('introspect', true, { detail: { active: response.active } });
        return response;
      } catch (err) {
        const errorKind = classifyError(err);
        record('introspect', false, { errorKind });
        throw err;
      }
    },

    async reset(): Promise<void> {
      env.reset();
      trace.length = 0;
      record('reset', true);
    },
  };
}
