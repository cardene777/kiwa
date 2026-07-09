/**
 * Mock adapter — drives `@kiwa-lab/auth`'s `setupOidcEnv` so the same Hono
 * OP exercises a deterministic OIDC surface without spawning Keycloak or a
 * docker container. Both mock + real adapters satisfy {@link OIDCOPAdapter}
 * so the fidelity harness can diff them side-by-side.
 *
 * Sub-Issue v1.21-4a wires the discovery + JWKS + DCR skeleton portion
 * of `setupOidcEnv`. Sub-Issue v1.21-4b (this state) layers the RFC 7591
 * DCR fidelity harness through `handleRegistration` (`src/lib/dcr.ts`) —
 * three auth methods, dropped-grant refusal, software_statement JWS
 * verification, and redirect_uris URL validation all funnel through the
 * same delegate. Sub-Issues c/d add authorize + token + id_token verify +
 * federation calls onto the same env.
 *
 * Every method appends a trace event so downstream tests can assert on the
 * OP's behavioural sequence + errorKind without regexing the underlying
 * thrown error messages.
 */

import {
  __resetOidcCounters,
  setupOidcEnv,
  type ClientRegistrationRequest,
  type ClientRegistrationResponse,
  type JwksDocument,
  type JwksKey,
  type OidcTestEnv,
  type OpenIdProviderMetadata,
} from '@kiwa-lab/auth';
import {
  handleRegistration,
  type ExtendedClientRegistrationRequest,
  type ExtendedClientRegistrationResponse,
} from '../lib/dcr.js';
import type {
  OIDCOPAdapter,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /**
   * `issuer` URL the OP publishes in discovery metadata. Defaults to
   * `https://op.example.test` to mirror the underlying kiwa mock default.
   */
  issuer?: string;
  /**
   * id_token lifetime in seconds. Passed through to `setupOidcEnv` for the
   * signer default. The v1.21-4a skeleton does not exercise id_tokens
   * directly; Sub-Issue v1.21-4c uses this to control expiry boundary
   * tests.
   */
  idTokenLifetimeSec?: number;
  /**
   * JWKS retention window in seconds. Retired keys stay in the JWKS
   * document until `now > retiredAt + retentionSec`. Fidelity axis 4
   * asserts the retention semantics — a rotated key stays observable but
   * the freshly-active key sits first in the `keys` array.
   */
  jwksRetentionSec?: number;
  /**
   * Deterministic clock. When omitted the mock uses `Date.now()`.
   */
  now?: () => number;
  /**
   * Trust anchor used to verify `software_statement` JWS signatures. When
   * omitted the mock refuses every registration that carries a
   * `software_statement`. Sub-Issue v1.21-4b (dcr-flow) wires this so the
   * fidelity harness can drive the verified-vs-tampered surfaces without
   * cracking real JWS crypto.
   */
  softwareStatementTrustAnchor?: string;
}

const DEFAULT_ISSUER = 'https://op.example.test';

/**
 * Classify a mock error into a stable trace `errorKind`. The mock throws
 * with typed messages (`discovery:` / `dcr:`) so the classifier pulls a
 * short kebab-case tag that tests can pin without scraping the underlying
 * exception.
 */
function classifyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('redirect_uris')) return 'invalid_redirect_uris';
  if (message.includes('grant_type')) return 'unsupported_grant_type';
  if (message.includes('response_type')) return 'unsupported_response_type';
  if (message.includes('token_endpoint_auth_method')) return 'unsupported_auth_method';
  if (message.includes('software_statement')) return 'invalid_software_statement';
  return 'unknown_error';
}

/**
 * Build the mock adapter. Boots `setupOidcEnv`, seeds the trace buffer,
 * hands back an `OIDCOPAdapter` bound to it. The env is disposed via
 * `reset()` (which reboots `setupOidcEnv`) so consecutive tests do not
 * leak state.
 */
export async function makeMockAdapter(
  options: MakeMockAdapterOptions = {},
): Promise<OIDCOPAdapter> {
  __resetOidcCounters();
  const issuer = options.issuer ?? DEFAULT_ISSUER;
  const nowFn = options.now;

  const boot = async (): Promise<OidcTestEnv> => {
    return setupOidcEnv({
      issuer,
      ...(options.idTokenLifetimeSec === undefined
        ? {}
        : { idTokenLifetimeSec: options.idTokenLifetimeSec }),
      ...(options.jwksRetentionSec === undefined
        ? {}
        : { jwksRetentionSec: options.jwksRetentionSec }),
      ...(nowFn === undefined ? {} : { now: nowFn }),
      ...(options.softwareStatementTrustAnchor === undefined
        ? {}
        : { softwareStatementIssuer: options.softwareStatementTrustAnchor }),
    });
  };

  let env: OidcTestEnv = await boot();
  const traces: TraceEvent[] = [];

  function push(event: TraceEvent): void {
    traces.push(event);
  }

  function discovery(): OpenIdProviderMetadata {
    try {
      const metadata = env.discovery.fetch();
      push({ op: 'discovery', ok: true });
      return metadata;
    } catch (err) {
      const errorKind = classifyError(err);
      push({ op: 'discovery', ok: false, errorKind });
      throw err;
    }
  }

  function jwks(): JwksDocument {
    try {
      const document = env.jwks.fetch();
      push({ op: 'jwks', ok: true });
      return document;
    } catch (err) {
      const errorKind = classifyError(err);
      push({ op: 'jwks', ok: false, errorKind });
      throw err;
    }
  }

  function rotateJwks(): JwksKey {
    try {
      const active = env.jwks.rotate();
      push({ op: 'jwksRotate', ok: true, detail: { kid: active.kid } });
      return active;
    } catch (err) {
      const errorKind = classifyError(err);
      push({ op: 'jwksRotate', ok: false, errorKind });
      throw err;
    }
  }

  function registerClient(
    request: ExtendedClientRegistrationRequest,
  ): ExtendedClientRegistrationResponse {
    const outcome = handleRegistration(
      (underlying: ClientRegistrationRequest): ClientRegistrationResponse =>
        env.registerClient(underlying),
      request,
    );
    if (outcome.ok) {
      push({
        op: 'registerClient',
        ok: true,
        detail: {
          client_id: outcome.response.client_id,
          ...(outcome.detail.auth_method === undefined
            ? {}
            : { auth_method: outcome.detail.auth_method }),
          ...(outcome.detail.software_statement === undefined
            ? {}
            : { software_statement: outcome.detail.software_statement }),
        },
      });
      return outcome.response;
    }
    push({
      op: 'registerClient',
      ok: false,
      errorKind: outcome.detail.errorKind ?? classifyError(outcome.error),
      ...(outcome.detail.software_statement === undefined
        ? {}
        : { detail: { software_statement: outcome.detail.software_statement } }),
    });
    throw outcome.error;
  }

  async function reset(): Promise<void> {
    await env.stop();
    __resetOidcCounters();
    env = await boot();
    traces.length = 0;
    push({ op: 'reset', ok: true });
  }

  return {
    mode: 'mock',
    traces: () => [...traces],
    discovery,
    jwks,
    rotateJwks,
    registerClient,
    reset,
  };
}
