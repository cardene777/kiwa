/**
 * PKCE-flow fidelity harness (Sub-Issue v1.21-3b — #865).
 *
 * Extends the endpoints-skeleton harness (Sub-Issue v1.21-3a — #864)
 * with PKCE-specific behavioural checks. Four fidelity axes are asserted
 * across the mock adapter (always available) plus the real adapter
 * (env-skipped when `OAUTH21_BOOTSTRAP` is unset — matches the
 * supabase-saas-app pattern).
 *
 *  1. verifier entropy — RFC 7636 §4.1. Verifier is 43-128 chars from
 *     the unreserved URL set `[A-Za-z0-9-._~]`. `createPkceChallenge`
 *     always emits values in that band; malformed verifiers are refused
 *     by the pre-flight guard at `/token`.
 *  2. challenge derivation — RFC 7636 §4.2.
 *     `code_challenge = base64url(SHA-256(code_verifier))`, no padding.
 *     Verified by both hand-computing the SHA-256 and by cross-checking
 *     the kiwa helper.
 *  3. S256 method enforcement — RFC 9700 §2.1.1. `plain` refused,
 *     unknown methods refused, missing method refused (OAuth 2.1 forbids
 *     defaulting to `plain`).
 *  4. verifier mismatch — RFC 6749 §5.2. Stored challenge with a
 *     different verifier at `/token` is refused with `invalid_grant`.
 */

import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  createPkceChallenge as kiwaCreatePkceChallenge,
  generateCodeVerifier as kiwaGenerateCodeVerifier,
} from '@kiwa-test/auth';
import type { AuthorizationRequest, TokenRequest } from '@kiwa-test/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  detectRealEnvMissing,
  makeRealAdapter,
  startOAuth2MockServer,
} from '../src/adapters/real.js';
import { createHonoApp } from '../src/lib/hono-app.js';
import {
  assertMethodAllowed,
  assertVerifierFormat,
  assertVerifierMatches,
  createPkceChallenge as dogfoodCreatePkceChallenge,
  deriveChallengeS256,
  PkceValidationError,
  PKCE_ALLOWED_METHOD,
  PKCE_VERIFIER_MAX_LENGTH,
  PKCE_VERIFIER_MIN_LENGTH,
  verifyChallenge,
} from '../src/lib/pkce.js';
import { assertAuthorizePkce } from '../src/app/authorize/route.js';
import { assertTokenPkce } from '../src/app/token/route.js';

const CLIENT = {
  clientId: 'dogfood-client',
  redirectUris: ['https://client.example.test/callback'],
  scopes: ['read', 'write'],
} as const;

const USER = {
  subject: 'user-1',
  scopes: ['read', 'write'],
} as const;

const REDIRECT = CLIENT.redirectUris[0];

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

/**
 * Hand-compute the RFC 7636 §4.2 challenge so the assertion does not
 * silently trust the kiwa helper. Ensures a bug in the kiwa layer would
 * still be caught by the harness.
 */
function sha256Base64Url(input: string): string {
  return createHash('sha256')
    .update(input)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

describe('axis 1 — verifier entropy (RFC 7636 §4.1)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('createPkceChallenge emits a verifier in the 43-128 char band', () => {
    for (let i = 0; i < 32; i += 1) {
      const challenge = dogfoodCreatePkceChallenge();
      expect(challenge.codeVerifier.length).toBeGreaterThanOrEqual(
        PKCE_VERIFIER_MIN_LENGTH,
      );
      expect(challenge.codeVerifier.length).toBeLessThanOrEqual(
        PKCE_VERIFIER_MAX_LENGTH,
      );
    }
  });

  it('createPkceChallenge emits verifiers only from the unreserved URL set', () => {
    const charset = /^[A-Za-z0-9\-._~]+$/;
    for (let i = 0; i < 32; i += 1) {
      const challenge = dogfoodCreatePkceChallenge();
      expect(challenge.codeVerifier).toMatch(charset);
    }
  });

  it('assertVerifierFormat rejects verifiers shorter than 43 chars', () => {
    const short = 'v' + '0'.repeat(41);
    expect(short.length).toBe(42);
    try {
      assertVerifierFormat(short);
      throw new Error('assertVerifierFormat did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PkceValidationError);
      expect((err as PkceValidationError).kind).toBe('verifier_too_short');
    }
  });

  it('assertVerifierFormat rejects verifiers longer than 128 chars', () => {
    const long = 'a'.repeat(129);
    try {
      assertVerifierFormat(long);
      throw new Error('assertVerifierFormat did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PkceValidationError);
      expect((err as PkceValidationError).kind).toBe('verifier_too_long');
    }
  });

  it('assertVerifierFormat rejects verifiers with reserved characters', () => {
    // Include a `+` which is outside the unreserved set. Total length
    // stays within [43, 128] so only the charset check should fire.
    const bad = 'v' + '+'.repeat(43);
    try {
      assertVerifierFormat(bad);
      throw new Error('assertVerifierFormat did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PkceValidationError);
      expect((err as PkceValidationError).kind).toBe(
        'verifier_invalid_charset',
      );
    }
  });

  it('kiwa-native generateCodeVerifier interoperates with dogfood assertVerifierFormat', () => {
    // Cross-check that the kiwa-emitted verifier passes the dogfood
    // guard — the two layers stay in sync so downgrades in either
    // would be observable.
    const verifier = kiwaGenerateCodeVerifier();
    expect(() => assertVerifierFormat(verifier)).not.toThrow();
  });
});

describe('axis 2 — challenge derivation (RFC 7636 §4.2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('deriveChallengeS256 returns base64url(SHA-256(verifier)) without padding', () => {
    for (let i = 0; i < 8; i += 1) {
      const verifier = kiwaGenerateCodeVerifier();
      const dogfoodDerived = deriveChallengeS256(verifier);
      const handComputed = sha256Base64Url(verifier);
      expect(dogfoodDerived).toBe(handComputed);
      // No padding at all.
      expect(dogfoodDerived).not.toContain('=');
      // No `+` or `/` from base64 (must be base64url).
      expect(dogfoodDerived).not.toContain('+');
      expect(dogfoodDerived).not.toContain('/');
      // SHA-256 → 32 bytes → 43 base64url chars.
      expect(dogfoodDerived.length).toBe(43);
    }
  });

  it('kiwa createPkceChallenge derives with S256 that matches deriveChallengeS256', () => {
    const kiwaTriple = kiwaCreatePkceChallenge();
    const rederived = deriveChallengeS256(kiwaTriple.codeVerifier);
    expect(rederived).toBe(kiwaTriple.codeChallenge);
  });

  it('verifyChallenge accepts a matching verifier + challenge pair', () => {
    const { codeVerifier, codeChallenge } = dogfoodCreatePkceChallenge();
    expect(verifyChallenge(codeVerifier, codeChallenge)).toBe(true);
  });

  it('verifyChallenge rejects a verifier whose hash does not match', () => {
    const a = dogfoodCreatePkceChallenge();
    const b = dogfoodCreatePkceChallenge();
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
    expect(verifyChallenge(a.codeVerifier, b.codeChallenge)).toBe(false);
  });
});

describe('axis 3 — S256 method enforcement (RFC 9700 §2.1.1)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('PKCE_ALLOWED_METHOD is S256', () => {
    expect(PKCE_ALLOWED_METHOD).toBe('S256');
  });

  it('assertMethodAllowed rejects plain with method_plain_refused', () => {
    try {
      assertMethodAllowed('plain');
      throw new Error('assertMethodAllowed did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PkceValidationError);
      expect((err as PkceValidationError).kind).toBe('method_plain_refused');
    }
  });

  it('assertMethodAllowed rejects an unknown method with method_unknown_refused', () => {
    try {
      assertMethodAllowed('SHA-1');
      throw new Error('assertMethodAllowed did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PkceValidationError);
      expect((err as PkceValidationError).kind).toBe('method_unknown_refused');
    }
  });

  it('assertMethodAllowed rejects a missing method with method_missing_refused', () => {
    try {
      assertMethodAllowed(undefined);
      throw new Error('assertMethodAllowed did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PkceValidationError);
      expect((err as PkceValidationError).kind).toBe('method_missing_refused');
    }
  });

  it('/authorize refuses code_challenge_method=plain with invalid_request', async () => {
    const { app } = await bootstrap();
    const url = new URL('https://as.example.test/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT.clientId);
    url.searchParams.set('redirect_uri', REDIRECT);
    url.searchParams.set('state', 'state-plain');
    url.searchParams.set('code_challenge', 'irrelevant-challenge-value-x');
    url.searchParams.set('code_challenge_method', 'plain');
    const res = await app.request(url.pathname + url.search);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, string>;
    expect(body['error']).toBe('invalid_request');
    expect(body['error_description']).toContain('plain');
  });

  it('/authorize refuses a request without code_challenge_method (no plain default)', async () => {
    const { app } = await bootstrap();
    const url = new URL('https://as.example.test/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT.clientId);
    url.searchParams.set('redirect_uri', REDIRECT);
    url.searchParams.set('state', 'state-nomethod');
    url.searchParams.set('code_challenge', 'irrelevant-challenge-value-x');
    // no code_challenge_method — OAuth 2.1 forbids defaulting to plain.
    const res = await app.request(url.pathname + url.search);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, string>;
    expect(body['error']).toBe('invalid_request');
  });

  it('/authorize refuses a request without a code_challenge', async () => {
    const { app } = await bootstrap();
    const url = new URL('https://as.example.test/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT.clientId);
    url.searchParams.set('redirect_uri', REDIRECT);
    url.searchParams.set('state', 'state-nochallenge');
    url.searchParams.set('code_challenge_method', 'S256');
    // no code_challenge — RFC 9700 §2.1 mandates it.
    const res = await app.request(url.pathname + url.search);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, string>;
    expect(body['error']).toBe('invalid_request');
    expect(body['error_description']).toContain('code_challenge');
  });

  it('assertAuthorizePkce accepts a well-formed request', () => {
    const challenge = dogfoodCreatePkceChallenge();
    const request: AuthorizationRequest = {
      responseType: 'code',
      clientId: CLIENT.clientId,
      redirectUri: REDIRECT,
      state: 'happy',
      codeChallenge: challenge.codeChallenge,
      codeChallengeMethod: 'S256',
    };
    expect(() => assertAuthorizePkce(request)).not.toThrow();
  });
});

describe('axis 4 — verifier mismatch rejection (RFC 6749 §5.2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('assertVerifierMatches accepts a matching pair', () => {
    const { codeVerifier, codeChallenge } = dogfoodCreatePkceChallenge();
    expect(() => assertVerifierMatches(codeVerifier, codeChallenge)).not.toThrow();
  });

  it('assertVerifierMatches rejects a mismatched pair with verifier_mismatch', () => {
    const a = dogfoodCreatePkceChallenge();
    const b = dogfoodCreatePkceChallenge();
    try {
      assertVerifierMatches(a.codeVerifier, b.codeChallenge);
      throw new Error('assertVerifierMatches did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PkceValidationError);
      expect((err as PkceValidationError).kind).toBe('verifier_mismatch');
    }
  });

  it('/token refuses an exchange whose verifier does not match the stored challenge', async () => {
    const { adapter, app } = await bootstrap();
    // Authorize with one challenge, then attempt to exchange with a
    // verifier drawn from a different challenge — the recorded
    // challenge will not verify.
    const a = dogfoodCreatePkceChallenge();
    const b = dogfoodCreatePkceChallenge();
    const authResp = adapter.authorize(
      {
        responseType: 'code',
        clientId: CLIENT.clientId,
        redirectUri: REDIRECT,
        state: 'mismatch-state',
        scope: 'read',
        codeChallenge: a.codeChallenge,
        codeChallengeMethod: 'S256',
      },
      USER.subject,
    );
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authResp.code,
      redirect_uri: REDIRECT,
      client_id: CLIENT.clientId,
      // wrong verifier — hashes to b.codeChallenge, not a.codeChallenge.
      code_verifier: b.codeVerifier,
    }).toString();
    const res = await app.request('/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    expect(res.status).toBe(400);
    const respBody = (await res.json()) as Record<string, string>;
    expect(respBody['error']).toBe('invalid_grant');
  });

  it('/token refuses an exchange with a malformed (short) verifier before the AS is invoked', async () => {
    const { adapter, app } = await bootstrap();
    const challenge = dogfoodCreatePkceChallenge();
    const authResp = adapter.authorize(
      {
        responseType: 'code',
        clientId: CLIENT.clientId,
        redirectUri: REDIRECT,
        state: 'short-state',
        scope: 'read',
        codeChallenge: challenge.codeChallenge,
        codeChallengeMethod: 'S256',
      },
      USER.subject,
    );
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authResp.code,
      redirect_uri: REDIRECT,
      client_id: CLIENT.clientId,
      code_verifier: 'too-short',
    }).toString();
    const res = await app.request('/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    expect(res.status).toBe(400);
    const respBody = (await res.json()) as Record<string, string>;
    expect(respBody['error']).toBe('invalid_request');
    expect(respBody['error_description']).toContain('code_verifier');
  });

  it('/token accepts a matching verifier and mints an access_token + refresh_token', async () => {
    const { adapter, app } = await bootstrap();
    const challenge = dogfoodCreatePkceChallenge();
    const authResp = adapter.authorize(
      {
        responseType: 'code',
        clientId: CLIENT.clientId,
        redirectUri: REDIRECT,
        state: 'happy-state',
        scope: 'read',
        codeChallenge: challenge.codeChallenge,
        codeChallengeMethod: 'S256',
      },
      USER.subject,
    );
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authResp.code,
      redirect_uri: REDIRECT,
      client_id: CLIENT.clientId,
      code_verifier: challenge.codeVerifier,
    }).toString();
    const res = await app.request('/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    expect(res.status).toBe(200);
    const respBody = (await res.json()) as Record<string, string | number>;
    expect(typeof respBody['access_token']).toBe('string');
    expect((respBody['access_token'] as string).length).toBeGreaterThan(0);
    expect(typeof respBody['refresh_token']).toBe('string');
    expect((respBody['refresh_token'] as string).length).toBeGreaterThan(0);
  });

  it('assertTokenPkce rejects an authorization_code request without a verifier', () => {
    const request: TokenRequest = {
      grantType: 'authorization_code',
      code: 'code-1',
      redirectUri: REDIRECT,
      clientId: CLIENT.clientId,
      codeVerifier: '',
    };
    try {
      assertTokenPkce(request);
      throw new Error('assertTokenPkce did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PkceValidationError);
      expect((err as PkceValidationError).kind).toBe('method_missing_refused');
    }
  });

  it('assertTokenPkce is a no-op for refresh_token requests (no verifier at that stage)', () => {
    const request: TokenRequest = {
      grantType: 'refresh_token',
      refreshToken: 'refresh-1',
      clientId: CLIENT.clientId,
    };
    expect(() => assertTokenPkce(request)).not.toThrow();
  });
});

describe('real adapter — env-skip + startOAuth2MockServer scaffolding', () => {
  afterEach(() => {
    delete process.env['OAUTH21_BOOTSTRAP'];
    delete process.env['KIWA_MODE'];
    delete process.env['OAUTH21_MOCK_SERVER_URL'];
  });

  it('startOAuth2MockServer rejects with KIWA_OAUTH21_ENV_MISSING when OAUTH21_BOOTSTRAP is unset', async () => {
    delete process.env['OAUTH21_BOOTSTRAP'];
    await expect(startOAuth2MockServer()).rejects.toThrow(
      /KIWA_OAUTH21_ENV_MISSING/,
    );
  });

  it('startOAuth2MockServer returns a handle when OAUTH21_MOCK_SERVER_URL points at a caller-managed server', async () => {
    process.env['OAUTH21_BOOTSTRAP'] = '1';
    process.env['OAUTH21_MOCK_SERVER_URL'] = 'http://127.0.0.1:9999';
    const handle = await startOAuth2MockServer();
    expect(handle.url).toBe('http://127.0.0.1:9999');
    expect(handle.authorizationEndpoint).toBe('http://127.0.0.1:9999/authorize');
    expect(handle.tokenEndpoint).toBe('http://127.0.0.1:9999/token');
    expect(handle.revocationEndpoint).toBe('http://127.0.0.1:9999/revoke');
    expect(handle.introspectionEndpoint).toBe('http://127.0.0.1:9999/introspect');
    expect(handle.discoveryEndpoint).toBe(
      'http://127.0.0.1:9999/.well-known/openid-configuration',
    );
    await handle.stop();
  });

  it('startOAuth2MockServer trims trailing slash on OAUTH21_MOCK_SERVER_URL', async () => {
    process.env['OAUTH21_BOOTSTRAP'] = '1';
    process.env['OAUTH21_MOCK_SERVER_URL'] = 'http://127.0.0.1:9999/';
    const handle = await startOAuth2MockServer();
    expect(handle.url).toBe('http://127.0.0.1:9999');
    await handle.stop();
  });

  it('startOAuth2MockServer without OAUTH21_MOCK_SERVER_URL rejects (testcontainers wiring pending)', async () => {
    process.env['OAUTH21_BOOTSTRAP'] = '1';
    delete process.env['OAUTH21_MOCK_SERVER_URL'];
    await expect(startOAuth2MockServer()).rejects.toThrow(
      /KIWA_OAUTH21_ENV_MISSING/,
    );
  });

  it('makeRealAdapter refuses /token with KIWA_OAUTH21_ENV_MISSING when env is missing', () => {
    const adapter = makeRealAdapter({ forceEnvMissing: true });
    expect(() =>
      adapter.token({
        grantType: 'authorization_code',
        code: 'code-1',
        redirectUri: REDIRECT,
        clientId: CLIENT.clientId,
        codeVerifier: 'v'.repeat(43),
      }),
    ).toThrow('KIWA_OAUTH21_ENV_MISSING');
    const trace = adapter.traces();
    expect(trace[0]?.op).toBe('token');
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe('KIWA_OAUTH21_ENV_MISSING');
  });

  it('detectRealEnvMissing returns null when OAUTH21_BOOTSTRAP=1 and KIWA_MODE is not mock', () => {
    process.env['OAUTH21_BOOTSTRAP'] = '1';
    delete process.env['KIWA_MODE'];
    expect(detectRealEnvMissing()).toBeNull();
  });
});
