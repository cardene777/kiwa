/**
 * Mock adapter — drives `@kiwa-test/auth`'s `setupOidcEnv` so the same Hono
 * OP exercises a deterministic OIDC surface without spawning Keycloak or a
 * docker container. Both mock + real adapters satisfy {@link OIDCOPAdapter}
 * so the fidelity harness can diff them side-by-side.
 *
 * Sub-Issue v1.21-4a (this state) wires the discovery + JWKS + DCR portion
 * of `setupOidcEnv`. Sub-Issues b/c/d add authorize + token + id_token
 * verify + federation calls onto the same env — the mock env already has
 * every helper, so extending the interface is a plumbing change, not a
 * new env boot.
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
} from '@kiwa-test/auth';
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
    request: ClientRegistrationRequest,
  ): ClientRegistrationResponse {
    try {
      const response = env.registerClient(request);
      push({
        op: 'registerClient',
        ok: true,
        detail: { client_id: response.client_id },
      });
      return response;
    } catch (err) {
      const errorKind = classifyError(err);
      push({ op: 'registerClient', ok: false, errorKind });
      throw err;
    }
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
