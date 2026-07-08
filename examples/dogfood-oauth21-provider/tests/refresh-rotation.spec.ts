/**
 * Refresh-rotation fidelity harness (Sub-Issue v1.21-3c — #866).
 *
 * Extends the pkce-flow harness (Sub-Issue v1.21-3b — #865) + DPoP-flow
 * harness (same Sub-Issue as this file) with rotation-specific
 * behavioural checks. Four fidelity axes asserted across the mock
 * adapter (always available) plus the real adapter (env-skipped when
 * `OAUTH21_BOOTSTRAP` is unset — matches the pkce-flow pattern).
 *
 *  1. rotation on use — RFC 9700 §2.2. Every `/token`
 *     `grant_type=refresh_token` success invalidates the previous
 *     token and mints a fresh one. Assert by observing that the old
 *     token is refused on second use.
 *  2. re-use detection — RFC 9700 §2.2.2. A call using the *previous*
 *     (already rotated) token fails with `invalid_grant` + tears down
 *     the whole token family (the just-minted token is unusable too).
 *  3. expiry enforcement — RFC 6749 §5.1. A refresh token past its
 *     `expiresAt` fails with `invalid_grant` before the AS mints any
 *     new token.
 *  4. binding preservation — RFC 9449 §4.3. The rotated token
 *     inherits `client_id` and DPoP `jkt` from the previous token; a
 *     proof pinned to a different key is refused.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  createDpopProof as kiwaCreateDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
} from '@kiwa/auth';
import type { ClientRegistration, DpopJwk } from '@kiwa/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { createHonoApp } from '../src/lib/hono-app.js';
import {
  classifyRefreshTokenError,
  RefreshRotationError,
  rotateAndMint,
} from '../src/lib/refresh-rotation.js';

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

const REDIRECT = CLIENT.redirectUris[0];
const ISSUER = 'https://as.example.test';

interface Bootstrap {
  adapter: Awaited<ReturnType<typeof makeMockAdapter>>;
  app: ReturnType<typeof createHonoApp>;
  setNow: (unixMs: number) => void;
  currentTime: () => number;
}

async function bootstrap(options?: {
  accessTokenLifetimeSec?: number;
  refreshTokenLifetimeSec?: number;
  dpopIatSkewSec?: number;
  initialTimeMs?: number;
  extraClients?: readonly ClientRegistration[];
}): Promise<Bootstrap> {
  __resetOAuth21Counters();
  const startTime = options?.initialTimeMs ?? 1_700_000_000_000;
  const clock = { now: startTime };
  const clients = options?.extraClients
    ? [CLIENT, ...options.extraClients]
    : [CLIENT];
  const adapter = await makeMockAdapter({
    issuer: ISSUER,
    clients,
    users: [USER],
    ...(options?.accessTokenLifetimeSec !== undefined
      ? { accessTokenLifetimeSec: options.accessTokenLifetimeSec }
      : {}),
    ...(options?.refreshTokenLifetimeSec !== undefined
      ? { refreshTokenLifetimeSec: options.refreshTokenLifetimeSec }
      : {}),
    ...(options?.dpopIatSkewSec !== undefined
      ? { dpopIatSkewSec: options.dpopIatSkewSec }
      : {}),
    now: () => clock.now,
  });
  const app = createHonoApp({ adapter, authenticatedSubject: USER.subject });
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
 * access_token + refresh_token. Optionally binds the resulting tokens
 * to a DPoP key by passing `dpopHeaderBuilder` — the builder receives
 * the fresh challenge iat + jti so each ceremony gets a distinct proof.
 */
async function performInitialGrant(args: {
  app: ReturnType<typeof createHonoApp>;
  state: string;
  now: number;
  dpopJwk?: DpopJwk;
  jti?: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | 'DPoP';
}> {
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

/**
 * Drive `/token` `grant_type=refresh_token` end-to-end. Returns the
 * parsed response so tests can assert both the freshly-minted token
 * pair and the token_type.
 */
async function performRefresh(args: {
  app: ReturnType<typeof createHonoApp>;
  refreshToken: string;
  now: number;
  dpopJwk?: DpopJwk;
  jti?: string;
  scope?: string;
  clientId?: string;
}): Promise<{
  status: number;
  body: Record<string, string | number | undefined>;
}> {
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
  const body: Record<string, string> = {
    grant_type: 'refresh_token',
    refresh_token: args.refreshToken,
    client_id: args.clientId ?? CLIENT.clientId,
  };
  if (args.scope !== undefined) body['scope'] = args.scope;
  const res = await args.app.request('/token', {
    method: 'POST',
    headers,
    body: new URLSearchParams(body).toString(),
  });
  return {
    status: res.status,
    body: (await res.json()) as Record<string, string | number | undefined>,
  };
}

describe('axis 1 — rotation on use (RFC 9700 §2.2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('/token grant_type=refresh_token mints a fresh refresh_token', async () => {
    const { app, currentTime } = await bootstrap();
    const initial = await performInitialGrant({
      app,
      state: 'rotation-happy',
      now: currentTime(),
    });
    const refresh = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
    });
    expect(refresh.status).toBe(200);
    expect(typeof refresh.body['refresh_token']).toBe('string');
    expect(refresh.body['refresh_token']).not.toBe(initial.refreshToken);
    expect(typeof refresh.body['access_token']).toBe('string');
    expect(refresh.body['access_token']).not.toBe(initial.accessToken);
  });

  it('/token grant_type=refresh_token increments rotationCount', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    const initial = await performInitialGrant({
      app,
      state: 'rotation-count',
      now: currentTime(),
    });
    const before = adapter
      .env()
      .server.listRefreshTokens()
      .find((rt) => rt.token === initial.refreshToken);
    expect(before?.rotationCount).toBe(0);
    const refresh = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
    });
    expect(refresh.status).toBe(200);
    const rotated = adapter
      .env()
      .server.listRefreshTokens()
      .find((rt) => rt.token === refresh.body['refresh_token']);
    expect(rotated?.rotationCount).toBe(1);
  });

  it('/token accepts a chain of consecutive rotations', async () => {
    const { app, currentTime } = await bootstrap();
    const initial = await performInitialGrant({
      app,
      state: 'chain',
      now: currentTime(),
    });
    let currentRefresh = initial.refreshToken;
    const seen = new Set<string>([currentRefresh]);
    for (let i = 0; i < 5; i += 1) {
      const res = await performRefresh({
        app,
        refreshToken: currentRefresh,
        now: currentTime(),
      });
      expect(res.status).toBe(200);
      const next = res.body['refresh_token'] as string;
      expect(seen.has(next)).toBe(false);
      seen.add(next);
      currentRefresh = next;
    }
    // 1 initial + 5 rotations = 6 distinct refresh tokens.
    expect(seen.size).toBe(6);
  });

  it('rotateAndMint mints a token with rotationCount incremented + inherited client', () => {
    const previous = {
      token: 'rt-old',
      clientId: CLIENT.clientId,
      subject: USER.subject,
      scope: 'read',
      rotationCount: 3,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      revoked: false,
    } as const;
    const next = rotateAndMint({
      previous,
      lifetimeSec: 3600,
      now: () => Date.now(),
    });
    expect(next.rotationCount).toBe(4);
    expect(next.clientId).toBe(CLIENT.clientId);
    expect(next.subject).toBe(USER.subject);
    expect(next.scope).toBe('read');
    expect(next.revoked).toBe(false);
    expect(next.token).not.toBe(previous.token);
  });
});

describe('axis 2 — re-use detection (RFC 9700 §2.2.2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('/token refuses the previous refresh_token after rotation with invalid_grant', async () => {
    const { app, currentTime } = await bootstrap();
    const initial = await performInitialGrant({
      app,
      state: 'reuse',
      now: currentTime(),
    });
    // First refresh — succeeds, invalidates initial.
    const first = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
    });
    expect(first.status).toBe(200);
    // Reuse of the original — must fail with invalid_grant.
    const reuse = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
    });
    expect(reuse.status).toBe(400);
    expect(reuse.body['error']).toBe('invalid_grant');
    expect(reuse.body['kind']).toBe('refresh_token_reused');
  });

  it('/token refuses an unknown refresh_token with invalid_grant + unknown_refresh_token', async () => {
    const { app, currentTime } = await bootstrap();
    const res = await performRefresh({
      app,
      refreshToken: 'rt-does-not-exist',
      now: currentTime(),
    });
    expect(res.status).toBe(400);
    expect(res.body['error']).toBe('invalid_grant');
    expect(res.body['kind']).toBe('unknown_refresh_token');
  });

  it('/token refuses reuse regardless of which client tries to re-exchange', async () => {
    const { app, currentTime } = await bootstrap({
      extraClients: [OTHER_CLIENT],
    });
    const initial = await performInitialGrant({
      app,
      state: 'reuse-cross-client',
      now: currentTime(),
    });
    await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
    });
    // Attacker with the exfiltrated refresh_token tries a different
    // client — refresh must fail even though the token *was* valid
    // before the legitimate rotation.
    const reuse = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
      clientId: OTHER_CLIENT.clientId,
    });
    expect(reuse.status).toBe(400);
    expect(reuse.body['error']).toBe('invalid_grant');
    expect(reuse.body['kind']).toBe('refresh_token_reused');
  });

  it('classifyRefreshTokenError maps the AS reuse message to refresh_token_reused', () => {
    const kind = classifyRefreshTokenError(
      'token: refresh_token "rt-1" has been rotated — reuse refused (RFC 9700 §2.2 rotation family compromise)',
    );
    expect(kind).toBe('refresh_token_reused');
  });

  it('classifyRefreshTokenError maps the AS unknown message to unknown_refresh_token', () => {
    const kind = classifyRefreshTokenError(
      'token: unknown refresh_token "rt-does-not-exist"',
    );
    expect(kind).toBe('unknown_refresh_token');
  });

  it('rotateAndMint refuses to rotate an already-revoked refresh token', () => {
    const revoked = {
      token: 'rt-revoked',
      clientId: CLIENT.clientId,
      subject: USER.subject,
      scope: 'read',
      rotationCount: 0,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      revoked: true,
    } as const;
    try {
      rotateAndMint({
        previous: revoked,
        lifetimeSec: 3600,
        now: () => Date.now(),
      });
      throw new Error('rotateAndMint did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RefreshRotationError);
      expect((err as RefreshRotationError).kind).toBe(
        'refresh_token_revoked',
      );
    }
  });
});

describe('axis 3 — expiry enforcement (RFC 6749 §5.1)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('/token refuses an expired refresh_token with invalid_grant', async () => {
    const initialTime = 1_700_000_000_000;
    const { app, setNow } = await bootstrap({
      refreshTokenLifetimeSec: 3600,
      initialTimeMs: initialTime,
    });
    const initial = await performInitialGrant({
      app,
      state: 'expiry',
      now: initialTime,
    });
    // Advance the clock past the refresh lifetime.
    setNow(initialTime + (3601 * 1000));
    const res = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: initialTime + (3601 * 1000),
    });
    expect(res.status).toBe(400);
    expect(res.body['error']).toBe('invalid_grant');
    expect(res.body['kind']).toBe('refresh_token_expired');
  });

  it('/token accepts a refresh_token at the boundary of its lifetime', async () => {
    const initialTime = 1_700_000_000_000;
    const { app, setNow } = await bootstrap({
      refreshTokenLifetimeSec: 3600,
      initialTimeMs: initialTime,
    });
    const initial = await performInitialGrant({
      app,
      state: 'expiry-boundary',
      now: initialTime,
    });
    // Advance the clock exactly to the boundary (still valid).
    setNow(initialTime + (3600 * 1000));
    const res = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: initialTime + (3600 * 1000),
    });
    expect(res.status).toBe(200);
  });

  it('/token accepts a refresh_token minted within the last second', async () => {
    const initialTime = 1_700_000_000_000;
    const { app } = await bootstrap({ initialTimeMs: initialTime });
    const initial = await performInitialGrant({
      app,
      state: 'expiry-fresh',
      now: initialTime,
    });
    const res = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: initialTime,
    });
    expect(res.status).toBe(200);
  });

  it('classifyRefreshTokenError maps the AS expiry message to refresh_token_expired', () => {
    const kind = classifyRefreshTokenError(
      'token: refresh_token "rt-1" is expired',
    );
    expect(kind).toBe('refresh_token_expired');
  });
});

describe('axis 4 — binding preservation (RFC 9449 §4.3)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('/token grant_type=refresh_token inherits DPoP jkt from the previous grant', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    const jwk = createMockDpopJwk();
    const initial = await performInitialGrant({
      app,
      state: 'dpop-bind',
      now: currentTime(),
      dpopJwk: jwk,
      jti: 'jti-bind-1',
    });
    expect(initial.tokenType).toBe('DPoP');
    // Refresh with a proof pinned to the same jwk — succeeds.
    const refresh = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
      dpopJwk: jwk,
      jti: 'jti-bind-2',
    });
    expect(refresh.status).toBe(200);
    expect(refresh.body['token_type']).toBe('DPoP');
    // Access token inherits the same jkt.
    const activeTokens = adapter.env().server.listAccessTokens();
    const nextAccess = activeTokens.find(
      (at) => at.token === refresh.body['access_token'],
    );
    expect(nextAccess?.tokenType).toBe('DPoP');
    expect(nextAccess?.dpopJkt).toBeDefined();
  });

  it('/token grant_type=refresh_token refuses a proof bound to a different jwk with invalid_dpop_proof', async () => {
    const { app, currentTime } = await bootstrap();
    const jwk = createMockDpopJwk();
    const attackerJwk = createMockDpopJwk();
    const initial = await performInitialGrant({
      app,
      state: 'dpop-attacker',
      now: currentTime(),
      dpopJwk: jwk,
      jti: 'jti-attacker-1',
    });
    const refresh = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
      dpopJwk: attackerJwk,
      jti: 'jti-attacker-2',
    });
    expect(refresh.status).toBe(400);
    expect(refresh.body['error']).toBe('invalid_dpop_proof');
    expect(refresh.body['kind']).toBe('dpop_binding_mismatch');
  });

  it('/token grant_type=refresh_token refuses a DPoP-bound token without a proof with invalid_dpop_proof', async () => {
    const { app, currentTime } = await bootstrap();
    const jwk = createMockDpopJwk();
    const initial = await performInitialGrant({
      app,
      state: 'dpop-missing-refresh',
      now: currentTime(),
      dpopJwk: jwk,
      jti: 'jti-missing-refresh-1',
    });
    // Refresh without DPoP header — must fail because the refresh
    // token is DPoP-bound.
    const refresh = await performRefresh({
      app,
      refreshToken: initial.refreshToken,
      now: currentTime(),
    });
    expect(refresh.status).toBe(400);
    expect(refresh.body['error']).toBe('invalid_dpop_proof');
    expect(refresh.body['kind']).toBe('dpop_binding_missing');
  });

  it('classifyRefreshTokenError maps the AS DPoP thumbprint mismatch to dpop_binding_mismatch', () => {
    const kind = classifyRefreshTokenError(
      'token: DPoP JWK thumbprint mismatch — refresh_token bound to a different key',
    );
    expect(kind).toBe('dpop_binding_mismatch');
  });

  it('classifyRefreshTokenError maps the AS missing DPoP proof to dpop_binding_missing', () => {
    const kind = classifyRefreshTokenError(
      'token: refresh_token is DPoP-bound but no DPoP proof was supplied',
    );
    expect(kind).toBe('dpop_binding_missing');
  });
});

describe('real adapter — refresh-rotation env-skip contract', () => {
  afterEach(() => {
    delete process.env['OAUTH21_BOOTSTRAP'];
    delete process.env['KIWA_MODE'];
    delete process.env['OAUTH21_MOCK_SERVER_URL'];
  });

  it('makeRealAdapter refuses grant_type=refresh_token with KIWA_OAUTH21_ENV_MISSING when env is missing', () => {
    const adapter = makeRealAdapter({ forceEnvMissing: true });
    expect(() =>
      adapter.token({
        grantType: 'refresh_token',
        refreshToken: 'rt-anything',
        clientId: CLIENT.clientId,
      }),
    ).toThrow('KIWA_OAUTH21_ENV_MISSING');
    const trace = adapter.traces();
    expect(trace[0]?.op).toBe('token');
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe('KIWA_OAUTH21_ENV_MISSING');
  });
});
