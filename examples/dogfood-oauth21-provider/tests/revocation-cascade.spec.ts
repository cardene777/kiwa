/**
 * Revocation-cascade fidelity harness (Sub-Issue v1.21-3d — #867).
 *
 * Extends the prior three specs (endpoints-skeleton #864 / pkce-flow #865 /
 * dpop-refresh-rotation #866) with cascade-specific behavioural checks.
 * Four fidelity axes asserted against the mock adapter (always available)
 * plus the real adapter's env-skip contract.
 *
 *  1. access_token revoke — RFC 7009 §2. `/revoke` on an access_token
 *     removes it from the active registry so `/introspect` returns
 *     `active=false` on the next lookup.
 *  2. cascade to refresh — RFC 9700 §2.2.2. Revoking an access_token
 *     tears down the whole refresh family; subsequent
 *     `grant_type=refresh_token` on the sibling refresh_token fails with
 *     `invalid_grant` even though the token was minted moments ago.
 *  3. reuse after revoke — RFC 7009 §2.2. A revoked refresh_token cannot
 *     be re-used to mint fresh access/refresh pairs; the AS refuses with
 *     `invalid_grant`.
 *  4. idempotency — RFC 7009 §2.2. Revoking the same token twice is a
 *     200 both times; the cascade report on the second call is empty
 *     (family already torn down).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  createDpopProof as kiwaCreateDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
} from '@kiwa-test/auth';
import type { ClientRegistration, DpopJwk } from '@kiwa-test/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { createHonoApp } from '../src/lib/hono-app.js';
import {
  cascadeRevoke,
  locateGrantFamily,
} from '../src/lib/revocation-cascade.js';
import { createCascadeRevokeHandler } from '../src/app/revoke/route.js';

const CLIENT = {
  clientId: 'dogfood-client',
  redirectUris: ['https://client.example.test/callback'],
  scopes: ['read', 'write'],
} as const;

const OTHER_CLIENT = {
  clientId: 'other-client',
  redirectUris: ['https://other.example.test/callback'],
  scopes: ['read'],
} as const;

const USER = {
  subject: 'user-1',
  scopes: ['read', 'write'],
} as const;

const OTHER_USER = {
  subject: 'user-2',
  scopes: ['read'],
} as const;

const REDIRECT = CLIENT.redirectUris[0];
const ISSUER = 'https://as.example.test';

interface Bootstrap {
  adapter: Awaited<ReturnType<typeof makeMockAdapter>>;
  app: ReturnType<typeof createHonoApp>;
  currentTime: () => number;
  setNow: (unixMs: number) => void;
}

async function bootstrap(options?: {
  extraClients?: readonly ClientRegistration[];
  extraUsers?: readonly { subject: string; scopes?: readonly string[] }[];
}): Promise<Bootstrap> {
  __resetOAuth21Counters();
  const clock = { now: 1_700_000_000_000 };
  const clients = options?.extraClients
    ? [CLIENT, ...options.extraClients]
    : [CLIENT];
  const users = options?.extraUsers
    ? [USER, ...options.extraUsers]
    : [USER];
  const adapter = await makeMockAdapter({
    issuer: ISSUER,
    clients,
    users,
    now: () => clock.now,
  });
  const app = createHonoApp({
    adapter,
    authenticatedSubject: USER.subject,
    cascadeAs: adapter.env().server,
  });
  return {
    adapter,
    app,
    currentTime: () => clock.now,
    setNow(unixMs: number) {
      clock.now = unixMs;
    },
  };
}

/**
 * Drive `/authorize` + `/token` end-to-end and return the parsed
 * access + refresh token pair. Optionally binds the tokens to a DPoP
 * key so cascade tests can assert on DPoP-bound families.
 */
async function performInitialGrant(args: {
  app: ReturnType<typeof createHonoApp>;
  state: string;
  now: number;
  dpopJwk?: DpopJwk;
  jti?: string;
}): Promise<{ accessToken: string; refreshToken: string; tokenType: 'Bearer' | 'DPoP' }> {
  const challenge = createPkceChallenge();
  const authUrl = new URL(`${ISSUER}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT.clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT);
  authUrl.searchParams.set('state', args.state);
  authUrl.searchParams.set('scope', 'read');
  authUrl.searchParams.set('code_challenge', challenge.codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  const authRes = await args.app.request(
    authUrl.pathname + authUrl.search,
    { redirect: 'manual' },
  );
  const location = authRes.headers.get('location');
  if (!location) {
    throw new Error(
      `performInitialGrant: no location header, status=${authRes.status}, body=${await authRes.text()}`,
    );
  }
  const redirect = new URL(location);
  const code = redirect.searchParams.get('code');
  if (!code) throw new Error('performInitialGrant: no code in redirect');
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
  };
  if (args.dpopJwk !== undefined) {
    const proof = kiwaCreateDpopProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: Math.floor(args.now / 1000),
      jti: args.jti ?? 'jti-initial',
      jwk: args.dpopJwk,
    });
    headers['DPoP'] = proof.jwt;
  }
  const tokenRes = await args.app.request('/token', {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT,
      client_id: CLIENT.clientId,
      code_verifier: challenge.codeVerifier,
    }).toString(),
  });
  if (tokenRes.status !== 200) {
    throw new Error(
      `performInitialGrant: /token returned ${tokenRes.status} — body ${await tokenRes.text()}`,
    );
  }
  const body = (await tokenRes.json()) as Record<string, string>;
  return {
    accessToken: body['access_token'] as string,
    refreshToken: body['refresh_token'] as string,
    tokenType: body['token_type'] as 'Bearer' | 'DPoP',
  };
}

async function performRevoke(args: {
  app: ReturnType<typeof createHonoApp>;
  token: string;
  clientId?: string;
}): Promise<{ status: number }> {
  const res = await args.app.request('/revoke', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token: args.token,
      client_id: args.clientId ?? CLIENT.clientId,
    }).toString(),
  });
  return { status: res.status };
}

async function performIntrospect(args: {
  app: ReturnType<typeof createHonoApp>;
  token: string;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await args.app.request('/introspect', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: args.token }).toString(),
  });
  return {
    status: res.status,
    body: (await res.json()) as Record<string, unknown>,
  };
}

async function performRefresh(args: {
  app: ReturnType<typeof createHonoApp>;
  refreshToken: string;
  now: number;
  dpopJwk?: DpopJwk;
  jti?: string;
}): Promise<{ status: number; body: Record<string, string | number | undefined> }> {
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
  };
  if (args.dpopJwk !== undefined) {
    const proof = kiwaCreateDpopProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: Math.floor(args.now / 1000),
      jti: args.jti ?? `jti-refresh-${Math.random().toString(36).slice(2)}`,
      jwk: args.dpopJwk,
    });
    headers['DPoP'] = proof.jwt;
  }
  const res = await args.app.request('/token', {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: args.refreshToken,
      client_id: CLIENT.clientId,
    }).toString(),
  });
  return {
    status: res.status,
    body: (await res.json()) as Record<string, string | number | undefined>,
  };
}

describe('axis 1 — access_token revoke (RFC 7009 §2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('/revoke on an access_token flips /introspect to active=false', async () => {
    const { app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis1-happy',
      now: currentTime(),
    });
    // Before revoke — introspection reports active.
    const before = await performIntrospect({ app, token: grant.accessToken });
    expect(before.status).toBe(200);
    expect(before.body['active']).toBe(true);
    // Revoke the access token.
    const revoke = await performRevoke({ app, token: grant.accessToken });
    expect(revoke.status).toBe(200);
    // After revoke — introspection reports inactive.
    const after = await performIntrospect({ app, token: grant.accessToken });
    expect(after.status).toBe(200);
    expect(after.body['active']).toBe(false);
  });

  it('/revoke on an access_token returns 200 with an empty body', async () => {
    const { app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis1-empty-body',
      now: currentTime(),
    });
    const res = await app.request('/revoke', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: grant.accessToken,
        client_id: CLIENT.clientId,
      }).toString(),
    });
    expect(res.status).toBe(200);
    const bodyText = await res.text();
    expect(bodyText).toBe('');
  });

  it('/revoke on an unknown token still returns 200 (RFC 7009 §2.2 idempotency)', async () => {
    const { app } = await bootstrap();
    const res = await performRevoke({ app, token: 'unknown-token-xyz' });
    expect(res.status).toBe(200);
  });

  it('locateGrantFamily returns the family for an access_token', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis1-locate-access',
      now: currentTime(),
    });
    const family = locateGrantFamily(adapter.env().server, grant.accessToken);
    expect(family).toEqual({
      clientId: CLIENT.clientId,
      subject: USER.subject,
    });
  });

  it('locateGrantFamily returns the family for a refresh_token', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis1-locate-refresh',
      now: currentTime(),
    });
    const family = locateGrantFamily(adapter.env().server, grant.refreshToken);
    expect(family).toEqual({
      clientId: CLIENT.clientId,
      subject: USER.subject,
    });
  });

  it('locateGrantFamily returns null for an unknown token', async () => {
    const { adapter } = await bootstrap();
    const family = locateGrantFamily(adapter.env().server, 'unknown-token');
    expect(family).toBeNull();
  });
});

describe('axis 2 — cascade to refresh (RFC 9700 §2.2.2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('/revoke on an access_token tears down the sibling refresh_token', async () => {
    const { app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis2-cascade',
      now: currentTime(),
    });
    // Revoke the access token — cascade should invalidate the refresh
    // sibling too.
    const revoke = await performRevoke({ app, token: grant.accessToken });
    expect(revoke.status).toBe(200);
    // Refresh with the sibling token — must fail because the family is
    // torn down.
    const refresh = await performRefresh({
      app,
      refreshToken: grant.refreshToken,
      now: currentTime(),
    });
    expect(refresh.status).toBe(400);
    expect(refresh.body['error']).toBe('invalid_grant');
  });

  it('/revoke on a refresh_token tears down the sibling access_token', async () => {
    const { app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis2-refresh-first',
      now: currentTime(),
    });
    const revoke = await performRevoke({ app, token: grant.refreshToken });
    expect(revoke.status).toBe(200);
    // Introspection on the access token should now return inactive.
    const introspect = await performIntrospect({
      app,
      token: grant.accessToken,
    });
    expect(introspect.body['active']).toBe(false);
  });

  it('cascadeRevoke reports the family fan-out', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis2-report',
      now: currentTime(),
    });
    const report = cascadeRevoke(
      adapter.env().server,
      grant.accessToken,
      CLIENT.clientId,
    );
    expect(report.accessTokensRevoked).toBe(1);
    expect(report.refreshTokensRevoked).toBe(1);
    expect(report.family).toEqual({
      clientId: CLIENT.clientId,
      subject: USER.subject,
    });
  });

  it('cascade fans out across multiple grants for the same (clientId, subject)', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    // Three consecutive grants to the same client + subject share a
    // family — cascade must revoke every one.
    const first = await performInitialGrant({
      app,
      state: 'axis2-fanout-1',
      now: currentTime(),
    });
    const second = await performInitialGrant({
      app,
      state: 'axis2-fanout-2',
      now: currentTime(),
    });
    const third = await performInitialGrant({
      app,
      state: 'axis2-fanout-3',
      now: currentTime(),
    });
    const report = cascadeRevoke(
      adapter.env().server,
      first.accessToken,
      CLIENT.clientId,
    );
    expect(report.accessTokensRevoked).toBe(3);
    expect(report.refreshTokensRevoked).toBe(3);
    // Every sibling refresh token must now fail.
    const r2 = await performRefresh({
      app,
      refreshToken: second.refreshToken,
      now: currentTime(),
    });
    expect(r2.status).toBe(400);
    const r3 = await performRefresh({
      app,
      refreshToken: third.refreshToken,
      now: currentTime(),
    });
    expect(r3.status).toBe(400);
  });

  it('cascade does not touch other subjects on the same client', async () => {
    const { adapter, app, currentTime } = await bootstrap({
      extraUsers: [OTHER_USER],
    });
    // Grant for user-1 (default authenticated subject).
    const targetGrant = await performInitialGrant({
      app,
      state: 'axis2-scope-user1',
      now: currentTime(),
    });
    // Manually inject a grant for user-2 by driving the adapter directly
    // (Hono handler pins `authenticatedSubject`, so we bypass it to
    // simulate two subjects on the same client).
    const challenge = createPkceChallenge();
    const authorize = adapter.env().server.authorize(
      {
        responseType: 'code',
        clientId: CLIENT.clientId,
        redirectUri: REDIRECT,
        state: 'axis2-user2',
        codeChallenge: challenge.codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'read',
      },
      OTHER_USER.subject,
    );
    const otherGrant = adapter.env().server.token({
      grantType: 'authorization_code',
      code: authorize.code,
      redirectUri: REDIRECT,
      clientId: CLIENT.clientId,
      codeVerifier: challenge.codeVerifier,
    });
    // Cascade on user-1 — must not touch user-2's tokens.
    const report = cascadeRevoke(
      adapter.env().server,
      targetGrant.accessToken,
      CLIENT.clientId,
    );
    expect(report.family?.subject).toBe(USER.subject);
    // user-2 token still active.
    const introspect = await performIntrospect({
      app,
      token: otherGrant.accessToken,
    });
    expect(introspect.body['active']).toBe(true);
  });

  it('cascade does not touch the same subject on a different client', async () => {
    const { adapter, app, currentTime } = await bootstrap({
      extraClients: [OTHER_CLIENT],
    });
    // Default grant on dogfood-client for user-1.
    const targetGrant = await performInitialGrant({
      app,
      state: 'axis2-scope-client-a',
      now: currentTime(),
    });
    // Grant on other-client for the same user-1.
    const challenge = createPkceChallenge();
    const authorize = adapter.env().server.authorize(
      {
        responseType: 'code',
        clientId: OTHER_CLIENT.clientId,
        redirectUri: OTHER_CLIENT.redirectUris[0],
        state: 'axis2-client-b',
        codeChallenge: challenge.codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'read',
      },
      USER.subject,
    );
    const otherGrant = adapter.env().server.token({
      grantType: 'authorization_code',
      code: authorize.code,
      redirectUri: OTHER_CLIENT.redirectUris[0],
      clientId: OTHER_CLIENT.clientId,
      codeVerifier: challenge.codeVerifier,
    });
    // Cascade for dogfood-client — must leave other-client tokens alive.
    const report = cascadeRevoke(
      adapter.env().server,
      targetGrant.accessToken,
      CLIENT.clientId,
    );
    expect(report.family?.clientId).toBe(CLIENT.clientId);
    // other-client token still active.
    const introspect = await performIntrospect({
      app,
      token: otherGrant.accessToken,
    });
    expect(introspect.body['active']).toBe(true);
  });

  it('cascade covers DPoP-bound families', async () => {
    const { app, currentTime } = await bootstrap();
    const jwk = createMockDpopJwk();
    const grant = await performInitialGrant({
      app,
      state: 'axis2-dpop',
      now: currentTime(),
      dpopJwk: jwk,
      jti: 'jti-dpop-cascade',
    });
    expect(grant.tokenType).toBe('DPoP');
    const revoke = await performRevoke({ app, token: grant.accessToken });
    expect(revoke.status).toBe(200);
    const refresh = await performRefresh({
      app,
      refreshToken: grant.refreshToken,
      now: currentTime(),
      dpopJwk: jwk,
      jti: 'jti-dpop-cascade-refresh',
    });
    expect(refresh.status).toBe(400);
    expect(refresh.body['error']).toBe('invalid_grant');
  });
});

describe('axis 3 — reuse after revoke (RFC 7009 §2.2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('a revoked refresh_token cannot be used to mint a fresh pair', async () => {
    const { app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis3-revoke-refresh',
      now: currentTime(),
    });
    await performRevoke({ app, token: grant.refreshToken });
    const refresh = await performRefresh({
      app,
      refreshToken: grant.refreshToken,
      now: currentTime(),
    });
    expect(refresh.status).toBe(400);
    expect(refresh.body['error']).toBe('invalid_grant');
  });

  it('a revoked access_token flips /introspect back to active=false permanently', async () => {
    const { app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis3-permanent',
      now: currentTime(),
    });
    await performRevoke({ app, token: grant.accessToken });
    // Multiple introspection calls all return inactive.
    for (let i = 0; i < 3; i += 1) {
      const introspect = await performIntrospect({
        app,
        token: grant.accessToken,
      });
      expect(introspect.body['active']).toBe(false);
    }
  });

  it('cross-client revoke is refused silently (RFC 7009 §2.1 client credential mismatch)', async () => {
    const { app, currentTime } = await bootstrap({
      extraClients: [OTHER_CLIENT],
    });
    const grant = await performInitialGrant({
      app,
      state: 'axis3-cross-client',
      now: currentTime(),
    });
    // Attacker with the exfiltrated token tries to revoke it under a
    // different client_id — 200 (RFC 7009 idempotency) but the token
    // must still be active.
    const revoke = await performRevoke({
      app,
      token: grant.accessToken,
      clientId: OTHER_CLIENT.clientId,
    });
    expect(revoke.status).toBe(200);
    // Legitimate token still active.
    const introspect = await performIntrospect({
      app,
      token: grant.accessToken,
    });
    expect(introspect.body['active']).toBe(true);
  });
});

describe('axis 4 — idempotency (RFC 7009 §2.2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('revoking the same token twice returns 200 both times', async () => {
    const { app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis4-double-revoke',
      now: currentTime(),
    });
    const first = await performRevoke({ app, token: grant.accessToken });
    expect(first.status).toBe(200);
    const second = await performRevoke({ app, token: grant.accessToken });
    expect(second.status).toBe(200);
  });

  it('cascadeRevoke on an already-revoked family reports zero fan-out', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis4-idem-report',
      now: currentTime(),
    });
    // First cascade.
    const first = cascadeRevoke(
      adapter.env().server,
      grant.accessToken,
      CLIENT.clientId,
    );
    expect(first.accessTokensRevoked).toBe(1);
    expect(first.refreshTokensRevoked).toBe(1);
    // Second cascade — family already torn down; the token itself was
    // deleted so family lookup returns null.
    const second = cascadeRevoke(
      adapter.env().server,
      grant.accessToken,
      CLIENT.clientId,
    );
    expect(second.accessTokensRevoked).toBe(0);
    expect(second.refreshTokensRevoked).toBe(0);
    expect(second.family).toBeNull();
  });

  it('createCascadeRevokeHandler delegate returns the cascade report', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    const grant = await performInitialGrant({
      app,
      state: 'axis4-handler',
      now: currentTime(),
    });
    const handler = createCascadeRevokeHandler(adapter.env().server);
    const report = handler({
      token: grant.accessToken,
      clientId: CLIENT.clientId,
    });
    expect(report.accessTokensRevoked).toBe(1);
    expect(report.refreshTokensRevoked).toBe(1);
    expect(report.family).toEqual({
      clientId: CLIENT.clientId,
      subject: USER.subject,
    });
  });

  it('createCascadeRevokeHandler swallows unknown tokens with empty report', () => {
    const bootstrapPromise = bootstrap();
    return bootstrapPromise.then((b) => {
      const handler = createCascadeRevokeHandler(b.adapter.env().server);
      const report = handler({ token: 'unknown', clientId: CLIENT.clientId });
      expect(report.accessTokensRevoked).toBe(0);
      expect(report.refreshTokensRevoked).toBe(0);
      expect(report.family).toBeNull();
    });
  });
});

describe('real adapter — revocation cascade env-skip contract', () => {
  afterEach(() => {
    delete process.env['OAUTH21_BOOTSTRAP'];
    delete process.env['KIWA_MODE'];
    delete process.env['OAUTH21_MOCK_SERVER_URL'];
  });

  it('makeRealAdapter refuses /revoke with KIWA_OAUTH21_ENV_MISSING when env is missing', () => {
    const adapter = makeRealAdapter({ forceEnvMissing: true });
    expect(() => adapter.revoke('at-anything', CLIENT.clientId)).toThrow(
      'KIWA_OAUTH21_ENV_MISSING',
    );
    const trace = adapter.traces();
    expect(trace[0]?.op).toBe('revoke');
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe('KIWA_OAUTH21_ENV_MISSING');
  });

  it('makeRealAdapter refuses /introspect with KIWA_OAUTH21_ENV_MISSING when env is missing', () => {
    const adapter = makeRealAdapter({ forceEnvMissing: true });
    expect(() => adapter.introspect('at-anything')).toThrow(
      'KIWA_OAUTH21_ENV_MISSING',
    );
    const trace = adapter.traces();
    expect(trace[0]?.op).toBe('introspect');
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe('KIWA_OAUTH21_ENV_MISSING');
  });
});
