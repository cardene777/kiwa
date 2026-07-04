/**
 * Endpoints-skeleton fidelity harness (Sub-Issue v1.21-3a).
 *
 * The mock adapter drives every RFC 9700 endpoint and the fidelity
 * harness diffs the observable response shape across four axes:
 *
 *  1. discovery metadata — `.well-known/openid-configuration` returns
 *     the mandatory RFC 8414 §2 shape restricted to the OAuth 2.1
 *     subset (`response_types_supported=[code]`,
 *     `grant_types_supported=[authorization_code, refresh_token]`,
 *     `code_challenge_methods_supported=[S256]`).
 *  2. `/authorize` OAuth 2.1 hardening — `response_type=token`
 *     (implicit) refused with `unsupported_response_type`,
 *     `code_challenge_method=plain` refused with `invalid_request`, a
 *     valid `code` grant returns 302 with `code` + `state` parameters.
 *  3. `/token` grant allowlist — `grant_type=password` /
 *     `grant_type=client_credentials` refused with
 *     `unsupported_grant_type`, `grant_type=authorization_code` + valid
 *     PKCE returns access_token + refresh_token.
 *  4. `/revoke` + `/introspect` contract — revoke swallows unknown
 *     tokens (RFC 7009 §2.2 idempotency), introspect returns
 *     `{active: false}` for revoked tokens, revoke of an active token
 *     flips introspect to `active: false`.
 *
 * Real adapter is exercised through the env-detect skeleton and
 * asserted to either produce identical discovery metadata (when
 * `OAUTH21_BOOTSTRAP=1`) or refuse via `KIWA_OAUTH21_ENV_MISSING`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetOAuth21Counters, createPkceChallenge } from '@kiwa-test/auth';
import type { AuthorizationRequest } from '@kiwa-test/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createHonoApp } from '../src/lib/hono-app.js';

const CLIENT = {
  clientId: 'dogfood-client',
  redirectUris: ['https://client.example.test/callback'],
  scopes: ['read', 'write'],
} as const;

const USER = {
  subject: 'user-1',
  scopes: ['read', 'write'],
} as const;

async function bootstrap() {
  __resetOAuth21Counters();
  const adapter = await makeMockAdapter({
    issuer: 'https://as.example.test',
    clients: [CLIENT],
    users: [USER],
  });
  const app = createHonoApp({ adapter, authenticatedSubject: USER.subject });
  return { adapter, app };
}

describe('axis 1 — discovery metadata', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('returns the RFC 8414 §2 shape restricted to OAuth 2.1 subset', async () => {
    const { app } = await bootstrap();
    const res = await app.request('/.well-known/openid-configuration');
    expect(res.status).toBe(200);
    const doc = (await res.json()) as Record<string, unknown>;
    expect(doc['issuer']).toBe('https://as.example.test');
    expect(doc['authorization_endpoint']).toBe('https://as.example.test/authorize');
    expect(doc['token_endpoint']).toBe('https://as.example.test/token');
    expect(doc['revocation_endpoint']).toBe('https://as.example.test/revoke');
    expect(doc['introspection_endpoint']).toBe('https://as.example.test/introspect');
    expect(doc['response_types_supported']).toEqual(['code']);
    expect(doc['grant_types_supported']).toEqual(['authorization_code', 'refresh_token']);
    expect(doc['code_challenge_methods_supported']).toEqual(['S256']);
    expect(doc['dpop_signing_alg_values_supported']).toEqual(['ES256']);
  });

  it('omits implicit + password + plain PKCE from the advertised subsets', async () => {
    const { app } = await bootstrap();
    const res = await app.request('/.well-known/openid-configuration');
    const doc = (await res.json()) as Record<string, string[]>;
    expect(doc['response_types_supported']).not.toContain('token');
    expect(doc['response_types_supported']).not.toContain('id_token');
    expect(doc['grant_types_supported']).not.toContain('password');
    expect(doc['grant_types_supported']).not.toContain('client_credentials');
    expect(doc['grant_types_supported']).not.toContain('implicit');
    expect(doc['code_challenge_methods_supported']).not.toContain('plain');
  });
});

describe('axis 2 — /authorize OAuth 2.1 hardening', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('refuses response_type=token with unsupported_response_type', async () => {
    const { app } = await bootstrap();
    const res = await app.request(
      '/authorize?response_type=token&client_id=dogfood-client&redirect_uri=https%3A%2F%2Fclient.example.test%2Fcallback&state=xyz',
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, string>;
    expect(body['error']).toBe('unsupported_response_type');
  });

  it('refuses code_challenge_method=plain with invalid_request', async () => {
    const { app } = await bootstrap();
    const res = await app.request(
      '/authorize?response_type=code&client_id=dogfood-client&redirect_uri=https%3A%2F%2Fclient.example.test%2Fcallback&state=xyz&code_challenge=abc&code_challenge_method=plain',
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, string>;
    expect(body['error']).toBe('invalid_request');
    expect(body['error_description']).toContain('S256');
  });

  it('returns 302 with code + state for a valid PKCE authorization request', async () => {
    const { app } = await bootstrap();
    const challenge = createPkceChallenge();
    const url = new URL('https://as.example.test/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT.clientId);
    url.searchParams.set('redirect_uri', CLIENT.redirectUris[0]);
    url.searchParams.set('state', 'state-1');
    url.searchParams.set('scope', 'read');
    url.searchParams.set('code_challenge', challenge.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    const res = await app.request(url.pathname + url.search);
    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const parsed = new URL(location!);
    expect(parsed.origin + parsed.pathname).toBe(CLIENT.redirectUris[0]);
    expect(parsed.searchParams.get('code')).toMatch(/^code-/);
    expect(parsed.searchParams.get('state')).toBe('state-1');
  });
});

describe('axis 3 — /token grant allowlist', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('refuses grant_type=password with unsupported_grant_type', async () => {
    const { app } = await bootstrap();
    const res = await app.request('/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=password&username=alice&password=secret',
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, string>;
    expect(body['error']).toBe('unsupported_grant_type');
  });

  it('refuses grant_type=client_credentials with unsupported_grant_type', async () => {
    const { app } = await bootstrap();
    const res = await app.request('/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials&client_id=dogfood-client',
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, string>;
    expect(body['error']).toBe('unsupported_grant_type');
  });

  it('exchanges a valid PKCE code for an access_token + refresh_token', async () => {
    const { adapter, app } = await bootstrap();
    const challenge = createPkceChallenge();
    // Step 1: drive /authorize to get a code.
    const authorizeRequest: AuthorizationRequest = {
      responseType: 'code',
      clientId: CLIENT.clientId,
      redirectUri: CLIENT.redirectUris[0],
      state: 'state-1',
      scope: 'read',
      codeChallenge: challenge.codeChallenge,
      codeChallengeMethod: 'S256',
    };
    const authResp = adapter.authorize(authorizeRequest, USER.subject);
    // Step 2: exchange the code at /token.
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authResp.code,
      redirect_uri: CLIENT.redirectUris[0],
      client_id: CLIENT.clientId,
      code_verifier: challenge.codeVerifier,
    }).toString();
    const res = await app.request('/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, string | number>;
    expect(typeof body['access_token']).toBe('string');
    expect((body['access_token'] as string).length).toBeGreaterThan(0);
    expect(body['token_type']).toBe('Bearer');
    expect(typeof body['refresh_token']).toBe('string');
    expect((body['refresh_token'] as string).length).toBeGreaterThan(0);
    expect(body['expires_in']).toBe(3600);
    expect(body['scope']).toBe('read');
  });
});

describe('axis 4 — /revoke + /introspect contract', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('/revoke returns 200 for unknown tokens (RFC 7009 §2.2 idempotency)', async () => {
    const { app } = await bootstrap();
    const res = await app.request('/revoke', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'token=nonexistent-token&client_id=dogfood-client',
    });
    expect(res.status).toBe(200);
  });

  it('/introspect returns active: false for unknown tokens', async () => {
    const { app } = await bootstrap();
    const res = await app.request('/introspect', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'token=nonexistent-token',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, boolean>;
    expect(body['active']).toBe(false);
  });

  it('revoke of an active token flips introspect to active: false', async () => {
    const { adapter, app } = await bootstrap();
    // Mint a token through the code flow.
    const challenge = createPkceChallenge();
    const authResp = adapter.authorize(
      {
        responseType: 'code',
        clientId: CLIENT.clientId,
        redirectUri: CLIENT.redirectUris[0],
        state: 'state-1',
        scope: 'read',
        codeChallenge: challenge.codeChallenge,
        codeChallengeMethod: 'S256',
      },
      USER.subject,
    );
    const tokenResp = adapter.token({
      grantType: 'authorization_code',
      code: authResp.code,
      redirectUri: CLIENT.redirectUris[0],
      clientId: CLIENT.clientId,
      codeVerifier: challenge.codeVerifier,
    });
    // Introspect: active = true.
    const introBefore = await app.request('/introspect', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `token=${encodeURIComponent(tokenResp.accessToken)}`,
    });
    const introBeforeBody = (await introBefore.json()) as Record<string, unknown>;
    expect(introBeforeBody['active']).toBe(true);
    expect(introBeforeBody['client_id']).toBe(CLIENT.clientId);
    expect(introBeforeBody['sub']).toBe(USER.subject);
    // Revoke.
    const revokeRes = await app.request('/revoke', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `token=${encodeURIComponent(tokenResp.accessToken)}&client_id=${CLIENT.clientId}`,
    });
    expect(revokeRes.status).toBe(200);
    // Introspect: active = false.
    const introAfter = await app.request('/introspect', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `token=${encodeURIComponent(tokenResp.accessToken)}`,
    });
    const introAfterBody = (await introAfter.json()) as Record<string, unknown>;
    expect(introAfterBody['active']).toBe(false);
  });
});

describe('real adapter — env-missing skeleton', () => {
  afterEach(() => {
    delete process.env['OAUTH21_BOOTSTRAP'];
    delete process.env['KIWA_MODE'];
  });

  it('detectRealEnvMissing reports KIWA_OAUTH21_ENV_MISSING when OAUTH21_BOOTSTRAP is unset', () => {
    delete process.env['OAUTH21_BOOTSTRAP'];
    expect(detectRealEnvMissing()).toBe('KIWA_OAUTH21_ENV_MISSING');
  });

  it('detectRealEnvMissing honours KIWA_MODE=mock override', () => {
    process.env['KIWA_MODE'] = 'mock';
    process.env['OAUTH21_BOOTSTRAP'] = '1';
    expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
  });

  it('real adapter refuses authorize + records env-missing trace', () => {
    const adapter = makeRealAdapter({ forceEnvMissing: true });
    expect(() =>
      adapter.authorize(
        {
          responseType: 'code',
          clientId: 'x',
          redirectUri: 'https://x/y',
          state: 's',
          codeChallenge: 'c',
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).toThrow('KIWA_OAUTH21_ENV_MISSING');
    const trace = adapter.traces();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('authorize');
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe('KIWA_OAUTH21_ENV_MISSING');
  });

  it('real adapter discovery returns metadata even when env is missing', () => {
    const adapter = makeRealAdapter({
      forceEnvMissing: true,
      issuer: 'https://as.real.test',
    });
    const doc = adapter.discovery();
    expect(doc.issuer).toBe('https://as.real.test');
    expect(doc.response_types_supported).toEqual(['code']);
    expect(doc.code_challenge_methods_supported).toEqual(['S256']);
  });
});
