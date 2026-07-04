/**
 * Real adapter — will spawn Keycloak through testcontainers when
 * `OIDC_BOOTSTRAP=1` is set + docker is reachable. Sub-Issue v1.21-4a (this
 * state) lands the env-detect skeleton so the fidelity harness can drive
 * the real adapter uniformly:
 *  - `discovery()` always returns a static shape derived from `issuer` so
 *    the harness has a reference metadata document even in env-missing.
 *  - `jwks()` / `rotateJwks()` / `registerClient()` refuse with
 *    `KIWA_OIDC_ENV_MISSING` until Sub-Issue v1.21-4b/c/d wire Keycloak.
 *
 * The env is considered ready when `OIDC_BOOTSTRAP=1` AND
 * `KEYCLOAK_URL` is populated. Both env vars are inspected lazily at
 * construction — the env-detect never touches process.env at import time
 * so vitest --isolate tests can override them per suite.
 */

import type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  JwksDocument,
  JwksKey,
  OpenIdProviderMetadata,
} from '@kiwa-test/auth';
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
   * Optional environment override. Defaults to `process.env`. Sub-Issue
   * v1.21-4b uses this to inject test fixtures without mutating the real
   * env.
   */
  env?: Record<string, string | undefined>;
}

const DEFAULT_ISSUER = 'https://op.example.test';

/**
 * Build the static discovery metadata derived from `issuer`. The real
 * driver returns this shape even in env-missing so the fidelity harness
 * always has a reference. Once Sub-Issue v1.21-4b wires Keycloak the
 * boot-time metadata will come from Keycloak's realm endpoint; until then
 * the static shape mirrors the mock's Discovery §3 defaults.
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
 * Detect whether the environment is ready to spawn Keycloak. Sub-Issue
 * v1.21-4a treats the env as never-ready (the wiring lands in later
 * Sub-Issues) but the shape of the check is fixed so downstream Sub-Issues
 * add container boot without changing the interface.
 */
function isEnvReady(env: Record<string, string | undefined>): boolean {
  return env['OIDC_BOOTSTRAP'] === '1' && Boolean(env['KEYCLOAK_URL']);
}

/**
 * Build the real adapter. The env-detect runs eagerly at construction so
 * the harness can decide whether to skip real-driver assertions before
 * pushing any events onto the trace buffer.
 */
export async function makeRealAdapter(
  options: MakeRealAdapterOptions = {},
): Promise<OIDCOPAdapter> {
  const issuer = options.issuer ?? DEFAULT_ISSUER;
  const env = options.env ?? (process.env as Record<string, string | undefined>);
  const envReady = isEnvReady(env);
  const staticMetadata = buildStaticDiscovery(issuer);
  const traces: TraceEvent[] = [];

  function push(event: TraceEvent): void {
    traces.push(event);
  }

  function discovery(): OpenIdProviderMetadata {
    // Discovery always returns the static shape even in env-missing so the
    // fidelity harness has a reference. Sub-Issue v1.21-4b swaps this out
    // for Keycloak's boot-time metadata when envReady is true.
    push({ op: 'discovery', ok: true });
    return staticMetadata;
  }

  function jwks(): JwksDocument {
    if (!envReady) {
      push({
        op: 'jwks',
        ok: false,
        errorKind: KIWA_OIDC_ENV_MISSING,
      });
      throw new Error(
        `${KIWA_OIDC_ENV_MISSING}: real adapter requires OIDC_BOOTSTRAP=1 and KEYCLOAK_URL`,
      );
    }
    // Sub-Issue v1.21-4b wires Keycloak `/certs` here.
    push({
      op: 'jwks',
      ok: false,
      errorKind: KIWA_OIDC_ENV_MISSING,
      detail: { reason: 'keycloak wiring pending (v1.21-4b)' },
    });
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: keycloak wiring pending (v1.21-4b)`,
    );
  }

  function rotateJwks(): JwksKey {
    push({
      op: 'jwksRotate',
      ok: false,
      errorKind: KIWA_OIDC_ENV_MISSING,
    });
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: real adapter cannot rotate JWKS in env-missing state`,
    );
  }

  function registerClient(
    _request: ClientRegistrationRequest,
  ): ClientRegistrationResponse {
    push({
      op: 'registerClient',
      ok: false,
      errorKind: KIWA_OIDC_ENV_MISSING,
    });
    throw new Error(
      `${KIWA_OIDC_ENV_MISSING}: real adapter cannot register clients in env-missing state`,
    );
  }

  async function reset(): Promise<void> {
    traces.length = 0;
    push({ op: 'reset', ok: true });
  }

  return {
    mode: 'real',
    traces: () => [...traces],
    discovery,
    jwks,
    rotateJwks,
    registerClient,
    reset,
  };
}
