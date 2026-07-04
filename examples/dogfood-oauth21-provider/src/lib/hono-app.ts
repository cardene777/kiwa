/**
 * Framework-agnostic Hono app builder for the OAuth 2.1 dogfood AS.
 *
 * Every route handler is a thin wrapper around the
 * {@link OAuth21ASAdapter} — the RP logic itself is Hono-agnostic and the
 * test harness can drive it either through `app.request(...)` (Hono's
 * built-in fetch-shaped invoker) or by mounting the handlers into a bare
 * Node HTTP server without booting a real Cloudflare Worker.
 *
 * Route mapping:
 *   GET  /.well-known/openid-configuration → adapter.discovery()
 *   GET  /authorize                        → assertAuthorizeQueryPkce(...) → adapter.authorize(...)
 *   POST /token                            → assertTokenPkce(...) → adapter.token(...)
 *   POST /revoke                           → adapter.revoke(...)
 *   POST /introspect                       → adapter.introspect(...)
 *
 * Sub-Issue v1.21-3a landed the routes + OAuth 2.1 hardening for
 * `response_type` + `grant_type`. Sub-Issue v1.21-3b (this file) added
 * the PKCE pre-flight guards at `/authorize` (method + challenge) and
 * `/token` (verifier format). Cryptographic verifier ↔ challenge
 * matching stays inside the kiwa AS because the recorded challenge
 * lives there; the pre-flight guards keep the error-kind surface
 * uniform across mock + real drivers.
 */

import { Hono } from 'hono';
import type {
  AuthorizationRequest,
  AuthorizationServer,
  DpopProof,
  TokenRequest,
} from '@kiwa-test/auth';
import type { OAuth21ASAdapter } from '../adapters/interface.js';
import { assertAuthorizeQueryPkce } from '../app/authorize/route.js';
import { assertTokenPkce } from '../app/token/route.js';
import {
  DpopValidationError,
  parseDpopHeader,
  type DpopRejectionKind,
} from './dpop.js';
import { PkceValidationError, type PkceRejectionKind } from './pkce.js';
import {
  classifyRefreshTokenError,
  type RefreshRotationRejectionKind,
} from './refresh-rotation.js';
import { cascadeRevoke } from './revocation-cascade.js';

export interface CreateHonoAppOptions {
  adapter: OAuth21ASAdapter;
  /**
   * Preseeded subject id the AS attributes the code to. Real deployments
   * derive the subject from an authenticated session; the dogfood app
   * accepts a static subject so tests can drive `/authorize` without
   * implementing login. Default = `user-1`.
   */
  authenticatedSubject?: string;
  /**
   * Direct handle to the underlying kiwa AS. When supplied `/revoke`
   * runs the cascade helper ({@link cascadeRevoke}) so a compromised
   * token tears down every access + active refresh in the
   * `(clientId, subject)` family (RFC 9700 §2.2.2). When omitted
   * `/revoke` falls back to the RFC 7009 single-token path via
   * `adapter.revoke(...)`.
   */
  cascadeAs?: AuthorizationServer;
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
  const cascadeAs = opts.cascadeAs;

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
    // OAuth 2.1 forbids `plain` PKCE + missing method + missing challenge.
    // Run the guard on the raw query values first — if it succeeds the
    // method is proven to be `S256` and the AS-facing request can be
    // built with the narrow type.
    try {
      assertAuthorizeQueryPkce({ codeChallenge, codeChallengeMethod });
    } catch (err) {
      if (err instanceof PkceValidationError) {
        return c.json(
          {
            error: mapPkceKindToAuthorizeCode(err.kind),
            error_description: err.message,
          },
          400,
        );
      }
      throw err;
    }

    const request: AuthorizationRequest = {
      responseType: 'code',
      clientId,
      redirectUri,
      state: state ?? '',
      ...(scope !== undefined ? { scope } : {}),
      codeChallenge: codeChallenge as string,
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

    // RFC 9449 §4 — the client sends the DPoP proof through the `DPoP`
    // HTTP header (case-insensitive). Parse it up-front so a malformed
    // proof surfaces as `invalid_dpop_proof` before the AS is invoked.
    // The header is optional at this layer — a plain-bearer client that
    // has never bound a DPoP key can still exchange codes for tokens,
    // and the AS records the resulting token as `token_type=Bearer`.
    const dpopHeader = c.req.header('DPoP') ?? c.req.header('dpop');
    let dpopProof: DpopProof | undefined;
    if (dpopHeader !== undefined && dpopHeader !== '') {
      try {
        dpopProof = parseDpopHeader(dpopHeader);
      } catch (err) {
        if (err instanceof DpopValidationError) {
          return c.json(
            {
              error: 'invalid_dpop_proof',
              error_description: err.message,
              // RFC 9449 §5.2 — surface the rejection kind so a client can
              // tell "your proof is malformed" apart from "your proof is
              // replaying an already-seen jti".
              kind: err.kind,
            },
            400,
          );
        }
        throw err;
      }
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
        ...(dpopProof !== undefined ? { dpop: dpopProof } : {}),
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
        ...(dpopProof !== undefined ? { dpop: dpopProof } : {}),
      };
    }

    try {
      assertTokenPkce(request);
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
      if (err instanceof PkceValidationError) {
        return c.json(
          {
            error: mapPkceKindToTokenCode(err.kind),
            error_description: err.message,
          },
          400,
        );
      }
      if (err instanceof DpopValidationError) {
        return c.json(
          {
            error: mapDpopKindToTokenCode(err.kind),
            error_description: err.message,
            kind: err.kind,
          },
          400,
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      // RFC 9449 §5.2 — DPoP proof verification failures surface from
      // the kiwa AS with a `verifyDpopProof:` prefix. Route them to
      // `invalid_dpop_proof` so a client can tell "your proof is
      // broken" apart from "your grant is broken".
      const dpopKind = classifyDpopAsError(message);
      if (dpopKind !== null) {
        return c.json(
          {
            error: 'invalid_dpop_proof',
            error_description: message,
            kind: dpopKind,
          },
          400,
        );
      }
      // RFC 9700 §2.2 — refresh rotation compromise surfaces with a
      // distinct AS-level message. The classifier maps every
      // rotation-family rejection to `invalid_grant` (RFC 6749 §5.2)
      // but keeps the `kind` on the response body so a client can
      // distinguish reuse (`refresh_token_reused` — family torn down)
      // from a plain unknown token (`unknown_refresh_token`).
      const rotationKind = classifyRefreshTokenError(message);
      if (rotationKind !== null) {
        return c.json(
          {
            error: mapRotationKindToTokenCode(rotationKind),
            error_description: message,
            kind: rotationKind,
          },
          400,
        );
      }
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
    // RFC 9700 §2.2.2 — when a direct AS handle is available, cascade the
    // revocation across the `(clientId, subject)` family so a compromised
    // token cannot ripple into follow-up refreshes. Legacy callers that
    // did not supply the AS handle fall back to RFC 7009 single-token
    // revocation via the adapter.
    try {
      if (cascadeAs) {
        cascadeRevoke(cascadeAs, token, clientId);
      } else {
        adapter.revoke(token, clientId);
      }
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

/**
 * Map a {@link PkceRejectionKind} raised at `/authorize` to the OAuth 2.1
 * error code the client should observe. RFC 6749 §4.1.2.1 —
 * `invalid_request` covers malformed / missing parameters (missing method
 * / plain refused / unknown method / missing challenge).
 */
function mapPkceKindToAuthorizeCode(kind: PkceRejectionKind): string {
  switch (kind) {
    case 'method_plain_refused':
    case 'method_missing_refused':
    case 'method_unknown_refused':
    case 'verifier_too_short':
    case 'verifier_too_long':
    case 'verifier_invalid_charset':
      return 'invalid_request';
    // verifier_mismatch cannot happen at /authorize (no verifier at that
    // stage) but is included so the switch is exhaustive.
    case 'verifier_mismatch':
      return 'invalid_grant';
  }
}

/**
 * Map a {@link PkceRejectionKind} raised at `/token` to the OAuth 2.1
 * error code. RFC 6749 §5.2 — `invalid_grant` for verifier mismatch (the
 * grant is invalid), `invalid_request` for the pre-flight format
 * failures (missing / malformed verifier).
 */
function mapPkceKindToTokenCode(kind: PkceRejectionKind): string {
  switch (kind) {
    case 'verifier_mismatch':
      return 'invalid_grant';
    case 'verifier_too_short':
    case 'verifier_too_long':
    case 'verifier_invalid_charset':
    case 'method_plain_refused':
    case 'method_missing_refused':
    case 'method_unknown_refused':
      return 'invalid_request';
  }
}

/**
 * Classify a kiwa AS-side rejection message from `verifyDpopProof(...)`
 * into a {@link DpopRejectionKind}. The kiwa AS invokes the verifier
 * inside `handleAuthorizationCode` + `handleRefreshToken`, so the
 * rejection surfaces at the outer `adapter.token(...)` call with a
 * `verifyDpopProof:` prefix — the classifier translates each prefix
 * into a stable OAuth error code without duplicating the switch in
 * every route handler.
 */
function classifyDpopAsError(message: string): DpopRejectionKind | null {
  if (!message.includes('verifyDpopProof')) return null;
  if (message.includes('htm mismatch')) return 'payload_htm_mismatch';
  if (message.includes('htu mismatch')) return 'payload_htu_mismatch';
  if (message.includes('iat outside allowed skew')) return 'payload_iat_skew';
  if (message.includes('proof missing jti')) return 'payload_jti_missing';
  if (message.includes('replay detected')) return 'payload_jti_replay';
  return 'header_malformed';
}

/**
 * Map a {@link DpopRejectionKind} raised at `/token` to the OAuth 2.1
 * error code. RFC 9449 §5.2 — every DPoP proof failure surfaces as
 * `invalid_dpop_proof`; the wrapper keeps the exhaustive switch so
 * adding a new kind forces the caller to decide which OAuth code to
 * emit.
 */
function mapDpopKindToTokenCode(kind: DpopRejectionKind): string {
  switch (kind) {
    case 'header_missing':
    case 'header_malformed':
    case 'header_typ_refused':
    case 'header_alg_refused':
    case 'header_jwk_refused':
    case 'payload_htm_mismatch':
    case 'payload_htu_mismatch':
    case 'payload_iat_skew':
    case 'payload_jti_missing':
    case 'payload_jti_replay':
    case 'thumbprint_mismatch':
      return 'invalid_dpop_proof';
  }
}

/**
 * Map a {@link RefreshRotationRejectionKind} raised at `/token` to the
 * OAuth 2.1 error code. RFC 6749 §5.2 — all rotation-family failures
 * surface as `invalid_grant`; RFC 9449 §5.2 — DPoP binding failures on
 * a refresh token surface as `invalid_dpop_proof` so the client can
 * tell "grant is broken" from "your DPoP key is wrong".
 */
function mapRotationKindToTokenCode(
  kind: RefreshRotationRejectionKind,
): string {
  switch (kind) {
    case 'unknown_refresh_token':
    case 'refresh_token_revoked':
    case 'refresh_token_expired':
    case 'refresh_token_reused':
    case 'client_id_mismatch':
    case 'scope_widened':
      return 'invalid_grant';
    case 'dpop_binding_missing':
    case 'dpop_binding_mismatch':
      return 'invalid_dpop_proof';
  }
}
