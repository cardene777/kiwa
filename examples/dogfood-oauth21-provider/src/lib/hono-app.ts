/**
 * Framework-agnostic Hono app builder for the OAuth 2.1 dogfood AS.
 *
 * Every route handler is a thin wrapper around the
 * {@link OAuth21ASAdapter} — the RP logic itself is Hono-agnostic and the
 * test harness can drive it either through `app.request(...)` (Hono's
 * built-in fetch-shaped invoker) or by mounting the handlers into a bare
 * Node HTTP server without booting a real Cloudflare Worker.
 *
 * Route mapping (Sub-Issue v1.21-3a, this file):
 *   GET  /.well-known/openid-configuration → adapter.discovery()
 *   GET  /authorize                        → adapter.authorize(...)
 *   POST /token                            → adapter.token(...)
 *   POST /revoke                           → adapter.revoke(...)
 *   POST /introspect                       → adapter.introspect(...)
 *
 * PKCE + DPoP + refresh rotation + revocation cascade are validated by
 * the underlying kiwa AS — the Hono handler is a translation layer
 * between Hono's `Context` and the shared adapter contract.
 */

import { Hono } from 'hono';
import type {
  AuthorizationRequest,
  TokenRequest,
} from '@kiwa-test/auth';
import type { OAuth21ASAdapter } from '../adapters/interface.js';

export interface CreateHonoAppOptions {
  adapter: OAuth21ASAdapter;
  /**
   * Preseeded subject id the AS attributes the code to. Real deployments
   * derive the subject from an authenticated session; the dogfood app
   * accepts a static subject so tests can drive `/authorize` without
   * implementing login. Default = `user-1`.
   */
  authenticatedSubject?: string;
}

/**
 * Build a fresh Hono app bound to a specific {@link OAuth21ASAdapter}.
 * The app is stateless — every request routes to the adapter which owns
 * the AS state (client + user + code + token registries).
 */
export function createHonoApp(opts: CreateHonoAppOptions): Hono {
  const app = new Hono();
  const adapter = opts.adapter;
  const subject = opts.authenticatedSubject ?? 'user-1';

  // RFC 8414 §3 — discovery metadata. Fixed shape, no request parameters.
  app.get('/.well-known/openid-configuration', (c) => {
    const doc = adapter.discovery();
    return c.json(doc, 200);
  });

  // RFC 6749 §4.1.1 — authorization request. RFC 9700 §2.1 mandates PKCE.
  // OAuth 2.1 refuses `response_type=token` (implicit) and any
  // `code_challenge_method` other than `S256`.
  app.get('/authorize', (c) => {
    const responseType = c.req.query('response_type');
    const clientId = c.req.query('client_id');
    const redirectUri = c.req.query('redirect_uri');
    const state = c.req.query('state');
    const scope = c.req.query('scope');
    const codeChallenge = c.req.query('code_challenge');
    const codeChallengeMethod = c.req.query('code_challenge_method');
    const resource = c.req.query('resource');

    if (!responseType || !clientId || !redirectUri) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'response_type, client_id and redirect_uri are required',
        },
        400,
      );
    }
    // OAuth 2.1 refuses implicit / hybrid up-front so a client cannot
    // discover the refusal only by inspecting the AS's error response —
    // discovery already advertises `response_types_supported: ['code']`.
    if (responseType !== 'code') {
      return c.json(
        {
          error: 'unsupported_response_type',
          error_description: `response_type "${responseType}" refused — OAuth 2.1 mandates "code"`,
        },
        400,
      );
    }
    // OAuth 2.1 forbids `plain` PKCE outright. Refuse before touching
    // the AS so the error is deterministic even when the AS is not
    // provisioned.
    if (codeChallengeMethod && codeChallengeMethod !== 'S256') {
      return c.json(
        {
          error: 'invalid_request',
          error_description: `code_challenge_method "${codeChallengeMethod}" refused — RFC 9700 §2.1.1 requires S256`,
        },
        400,
      );
    }

    const request: AuthorizationRequest = {
      responseType: 'code',
      clientId,
      redirectUri,
      state: state ?? '',
      ...(scope !== undefined ? { scope } : {}),
      codeChallenge: codeChallenge ?? '',
      codeChallengeMethod: 'S256',
      ...(resource !== undefined ? { resource } : {}),
    };

    try {
      const response = adapter.authorize(request, subject);
      // RFC 6749 §4.1.2 — 302 redirect with `code` + `state` in query.
      const redirectUrl = new URL(response.redirectUri);
      redirectUrl.searchParams.set('code', response.code);
      redirectUrl.searchParams.set('state', response.state);
      return c.redirect(redirectUrl.toString(), 302);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = classifyAuthorizeErrorStatus(message);
      return c.json(
        {
          error: classifyAuthorizeErrorCode(message),
          error_description: message,
        },
        status,
      );
    }
  });

  // RFC 6749 §4.1.3 — token exchange. RFC 9700 §2 constrains the grant
  // types accepted to `authorization_code` + `refresh_token`.
  app.post('/token', async (c) => {
    const contentType = c.req.header('content-type') ?? '';
    let body: Record<string, string>;
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await c.req.text();
      body = Object.fromEntries(new URLSearchParams(raw));
    } else if (contentType.includes('application/json')) {
      body = (await c.req.json()) as Record<string, string>;
    } else {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'content-type must be application/x-www-form-urlencoded or application/json',
        },
        400,
      );
    }

    const grantType = body['grant_type'];
    if (!grantType) {
      return c.json(
        { error: 'invalid_request', error_description: 'grant_type required' },
        400,
      );
    }
    if (
      grantType === 'password' ||
      grantType === 'client_credentials' ||
      grantType === 'implicit'
    ) {
      return c.json(
        {
          error: 'unsupported_grant_type',
          error_description: `grant_type "${grantType}" refused — dropped by OAuth 2.1 / RFC 9700`,
        },
        400,
      );
    }
    if (grantType !== 'authorization_code' && grantType !== 'refresh_token') {
      return c.json(
        {
          error: 'unsupported_grant_type',
          error_description: `unknown grant_type "${grantType}"`,
        },
        400,
      );
    }

    let request: TokenRequest;
    if (grantType === 'authorization_code') {
      const code = body['code'];
      const redirectUri = body['redirect_uri'];
      const clientId = body['client_id'];
      const codeVerifier = body['code_verifier'];
      if (!code || !redirectUri || !clientId || !codeVerifier) {
        return c.json(
          {
            error: 'invalid_request',
            error_description: 'code, redirect_uri, client_id and code_verifier are required',
          },
          400,
        );
      }
      request = {
        grantType: 'authorization_code',
        code,
        redirectUri,
        clientId,
        codeVerifier,
      };
    } else {
      const refreshToken = body['refresh_token'];
      const clientId = body['client_id'];
      if (!refreshToken || !clientId) {
        return c.json(
          {
            error: 'invalid_request',
            error_description: 'refresh_token and client_id are required',
          },
          400,
        );
      }
      request = {
        grantType: 'refresh_token',
        refreshToken,
        clientId,
        ...(body['scope'] !== undefined ? { scope: body['scope'] } : {}),
      };
    }

    try {
      const response = adapter.token(request);
      // RFC 6749 §5.1 — token response uses snake_case keys.
      return c.json(
        {
          access_token: response.accessToken,
          token_type: response.tokenType,
          expires_in: response.expiresIn,
          refresh_token: response.refreshToken,
          scope: response.scope,
        },
        200,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json(
        {
          error: classifyTokenErrorCode(message),
          error_description: message,
        },
        400,
      );
    }
  });

  // RFC 7009 §2 — token revocation. Idempotent (RFC 7009 §2.2), so the
  // handler always returns 200 whether or not the token existed.
  app.post('/revoke', async (c) => {
    const contentType = c.req.header('content-type') ?? '';
    let body: Record<string, string>;
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await c.req.text();
      body = Object.fromEntries(new URLSearchParams(raw));
    } else if (contentType.includes('application/json')) {
      body = (await c.req.json()) as Record<string, string>;
    } else {
      return c.json(
        { error: 'invalid_request' },
        400,
      );
    }

    const token = body['token'];
    const clientId = body['client_id'];
    if (!token || !clientId) {
      return c.json(
        { error: 'invalid_request', error_description: 'token and client_id required' },
        400,
      );
    }
    try {
      adapter.revoke(token, clientId);
    } catch {
      // RFC 7009 §2.2 — revocation is idempotent. Silently swallow the
      // AS's rejection so a client that reuses a revoke request doesn't
      // observe a 400.
    }
    return c.body(null, 200);
  });

  // RFC 7662 §2 — token introspection. Returns `{active: false}` when
  // the token is unknown / expired / revoked so a resource server can
  // decide whether to accept the request.
  app.post('/introspect', async (c) => {
    const contentType = c.req.header('content-type') ?? '';
    let body: Record<string, string>;
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await c.req.text();
      body = Object.fromEntries(new URLSearchParams(raw));
    } else if (contentType.includes('application/json')) {
      body = (await c.req.json()) as Record<string, string>;
    } else {
      return c.json({ error: 'invalid_request' }, 400);
    }
    const token = body['token'];
    if (!token) {
      return c.json(
        { error: 'invalid_request', error_description: 'token required' },
        400,
      );
    }
    try {
      const response = adapter.introspect(token);
      // RFC 7662 §2.2 — snake_case keys.
      const responseBody: Record<string, unknown> = { active: response.active };
      if (response.scope !== undefined) responseBody['scope'] = response.scope;
      if (response.clientId !== undefined) responseBody['client_id'] = response.clientId;
      if (response.sub !== undefined) responseBody['sub'] = response.sub;
      if (response.exp !== undefined) responseBody['exp'] = response.exp;
      if (response.tokenType !== undefined) responseBody['token_type'] = response.tokenType;
      if (response.resource !== undefined) responseBody['resource'] = response.resource;
      return c.json(responseBody, 200);
    } catch {
      // Unknown token per RFC 7662 §2.2 — return `active: false`.
      return c.json({ active: false }, 200);
    }
  });

  return app;
}

/**
 * Map an `/authorize` rejection to an HTTP status. Client-caused errors
 * (unknown response_type / bad PKCE / missing state) surface as 400 so
 * the client can correct + retry.
 */
function classifyAuthorizeErrorStatus(message: string): 400 | 500 {
  if (message.includes('unknown client_id')) return 400;
  if (message.includes('unknown subject')) return 500;
  if (message.includes('redirect_uri')) return 400;
  if (message.includes('code_challenge')) return 400;
  if (message.includes('state parameter')) return 400;
  if (message.includes('response_type')) return 400;
  return 500;
}

/**
 * Map an `/authorize` rejection message to an RFC 6749 §4.1.2.1 error
 * code. Falls back to `server_error` for anything the AS did not label.
 */
function classifyAuthorizeErrorCode(message: string): string {
  if (message.includes('response_type')) return 'unsupported_response_type';
  if (message.includes('code_challenge')) return 'invalid_request';
  if (message.includes('state parameter')) return 'invalid_request';
  if (message.includes('unknown client_id')) return 'unauthorized_client';
  if (message.includes('redirect_uri')) return 'invalid_request';
  return 'server_error';
}

/**
 * Map a `/token` rejection message to an RFC 6749 §5.2 error code.
 */
function classifyTokenErrorCode(message: string): string {
  if (message.includes('unknown authorization code')) return 'invalid_grant';
  if (message.includes('already exchanged')) return 'invalid_grant';
  if (message.includes('PKCE code_verifier')) return 'invalid_grant';
  if (message.includes('redirect_uri mismatch')) return 'invalid_grant';
  if (message.includes('client_id mismatch')) return 'invalid_grant';
  if (message.includes('grant_type')) return 'unsupported_grant_type';
  if (message.includes('DPoP')) return 'invalid_dpop_proof';
  if (message.includes('refresh_token')) return 'invalid_grant';
  return 'invalid_request';
}
