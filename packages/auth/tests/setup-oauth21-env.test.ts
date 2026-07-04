import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  computeDpopJkt,
  createAuthorizationServer,
  createDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
  deriveCodeChallenge,
  generateCodeVerifier,
  parseDpopProof,
  setupOAuth21Env,
  verifyCodeChallenge,
  verifyDpopProof,
  type AuthorizationRequest,
  type OAuth21TestEnv,
} from '../src/index.js';

const envs: OAuth21TestEnv[] = [];

beforeEach(() => {
  __resetOAuth21Counters();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(now?: () => number): Promise<OAuth21TestEnv> {
  const env = await setupOAuth21Env({
    issuer: 'https://as.example.test',
    clients: [
      {
        clientId: 'client-A',
        redirectUris: ['https://app.example.test/cb'],
        scopes: ['openid', 'profile', 'email'],
        clientType: 'public',
      },
    ],
    users: [
      { subject: 'user-1', scopes: ['openid', 'profile', 'email'] },
    ],
    ...(now === undefined ? {} : { now }),
  });
  envs.push(env);
  return env;
}

function completeAuthorization(
  env: OAuth21TestEnv,
  overrides?: Partial<AuthorizationRequest>,
): { code: string; codeVerifier: string; codeChallenge: string } {
  const { codeVerifier, codeChallenge } = env.createPkceChallenge();
  const authRes = env.server.authorize(
    {
      responseType: 'code',
      clientId: 'client-A',
      redirectUri: 'https://app.example.test/cb',
      state: 'state-1',
      scope: 'openid profile',
      codeChallenge,
      codeChallengeMethod: 'S256',
      ...(overrides ?? {}),
    },
    'user-1',
  );
  return { code: authRes.code, codeVerifier, codeChallenge };
}

describe('PKCE helpers (RFC 7636 + RFC 9700 §2.1.1)', () => {
  it('generateCodeVerifier produces a base64url 43-char verifier per invocation', () => {
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    expect(v1).not.toBe(v2);
    expect(v1.length).toBe(43);
    expect(v2.length).toBe(43);
    expect(v1).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('deriveCodeChallenge produces deterministic S256 hash of the verifier', () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = deriveCodeChallenge(verifier, 'S256');
    // Known reference vector from RFC 7636 §4.4.
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('deriveCodeChallenge rejects the "plain" method per RFC 9700 §2.1.1', () => {
    const verifier = generateCodeVerifier();
    expect(() =>
      deriveCodeChallenge(verifier, 'plain' as unknown as 'S256'),
    ).toThrow(/PKCE method "plain" is forbidden/);
  });

  it('deriveCodeChallenge rejects unknown methods and short verifiers', () => {
    expect(() =>
      deriveCodeChallenge('too-short', 'S256'),
    ).toThrow(/verifier must be 43-128 chars/);
    expect(() =>
      deriveCodeChallenge('a'.repeat(43), 'HS256' as unknown as 'S256'),
    ).toThrow(/unknown PKCE method "HS256"/);
  });

  it('createPkceChallenge round-trips through verifyCodeChallenge', () => {
    const challenge = createPkceChallenge();
    expect(
      verifyCodeChallenge(
        challenge.codeVerifier,
        challenge.codeChallenge,
        challenge.codeChallengeMethod,
      ),
    ).toBe(true);
    expect(
      verifyCodeChallenge('a'.repeat(43), challenge.codeChallenge, 'S256'),
    ).toBe(false);
  });
});

describe('DPoP proof helpers (RFC 9449)', () => {
  it('createDpopProof emits a compact 3-segment JWT with dpop+jwt header', () => {
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    expect(proof.jwt.split('.')).toHaveLength(3);
    expect(proof.header.typ).toBe('dpop+jwt');
    expect(proof.header.alg).toBe('ES256');
    expect(proof.header.jwk.kty).toBe('EC');
    expect(proof.header.jwk.crv).toBe('P-256');
    expect(proof.payload.htm).toBe('POST');
    expect(proof.payload.htu).toBe('https://as.example.test/token');
  });

  it('parseDpopProof round-trips a proof created by createDpopProof', () => {
    const original = createDpopProof({
      htm: 'GET',
      htu: 'https://rs.example.test/orders/1',
      iat: 1_700_000_000,
      jti: 'jti-known',
    });
    const parsed = parseDpopProof(original.jwt);
    expect(parsed.payload.htm).toBe('GET');
    expect(parsed.payload.htu).toBe('https://rs.example.test/orders/1');
    expect(parsed.payload.iat).toBe(1_700_000_000);
    expect(parsed.payload.jti).toBe('jti-known');
  });

  it('parseDpopProof rejects a mangled JWT string', () => {
    expect(() => parseDpopProof('not.a.jwt.extra.segments')).toThrow(
      /expected compact JWT with 3 segments/,
    );
  });

  it('verifyDpopProof accepts a matching htm / htu / iat proof', () => {
    const seen = new Set<string>();
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    const verified = verifyDpopProof(proof, {
      expectedHtm: 'POST',
      expectedHtu: 'https://as.example.test/token',
      seenJtis: seen,
      now: () => Date.now(),
      iatSkewSec: 60,
    });
    expect(verified.header.jwk.kty).toBe('EC');
    // jti was consumed and now sits in the replay registry.
    expect(seen.has(verified.payload.jti)).toBe(true);
  });

  it('verifyDpopProof rejects an htm mismatch', () => {
    const seen = new Set<string>();
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    expect(() =>
      verifyDpopProof(proof, {
        expectedHtm: 'GET',
        expectedHtu: 'https://as.example.test/token',
        seenJtis: seen,
        now: () => Date.now(),
        iatSkewSec: 60,
      }),
    ).toThrow(/htm mismatch/);
  });

  it('verifyDpopProof rejects an htu mismatch', () => {
    const seen = new Set<string>();
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    expect(() =>
      verifyDpopProof(proof, {
        expectedHtm: 'POST',
        expectedHtu: 'https://as.example.test/introspect',
        seenJtis: seen,
        now: () => Date.now(),
        iatSkewSec: 60,
      }),
    ).toThrow(/htu mismatch/);
  });

  it('verifyDpopProof rejects a replayed jti on the second use', () => {
    const seen = new Set<string>();
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
      jti: 'jti-replay-test',
    });
    verifyDpopProof(proof, {
      expectedHtm: 'POST',
      expectedHtu: 'https://as.example.test/token',
      seenJtis: seen,
      now: () => Date.now(),
      iatSkewSec: 60,
    });
    expect(() =>
      verifyDpopProof(proof, {
        expectedHtm: 'POST',
        expectedHtu: 'https://as.example.test/token',
        seenJtis: seen,
        now: () => Date.now(),
        iatSkewSec: 60,
      }),
    ).toThrow(/jti "jti-replay-test" replay detected/);
  });

  it('verifyDpopProof rejects an iat outside the skew tolerance', () => {
    const seen = new Set<string>();
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
      iat: 1_700_000_000,
    });
    expect(() =>
      verifyDpopProof(proof, {
        expectedHtm: 'POST',
        expectedHtu: 'https://as.example.test/token',
        seenJtis: seen,
        now: () => 1_700_003_000 * 1000,
        iatSkewSec: 60,
      }),
    ).toThrow(/iat outside allowed skew/);
  });

  it('computeDpopJkt produces stable base64url thumbprints for identical JWKs', () => {
    const jwk = createMockDpopJwk();
    const first = computeDpopJkt(jwk);
    const second = computeDpopJkt(jwk);
    expect(first).toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('Authorization endpoint (/authorize)', () => {
  it('issues an authorization code with state echoed back', async () => {
    const env = await makeEnv();
    const { code, codeChallenge } = completeAuthorization(env);
    expect(code).toMatch(/^code-/);
    expect(codeChallenge.length).toBe(43);
  });

  it('rejects response_type other than "code" (RFC 9700 drops implicit + hybrid)', async () => {
    const env = await makeEnv();
    const { codeChallenge } = env.createPkceChallenge();
    expect(() =>
      env.server.authorize(
        {
          responseType: 'token' as unknown as 'code',
          clientId: 'client-A',
          redirectUri: 'https://app.example.test/cb',
          state: 's-1',
          codeChallenge,
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).toThrow(/response_type "token" refused/);
  });

  it('rejects code_challenge_method=plain (RFC 9700 §2.1.1)', async () => {
    const env = await makeEnv();
    const { codeChallenge } = env.createPkceChallenge();
    expect(() =>
      env.server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://app.example.test/cb',
          state: 's-1',
          codeChallenge,
          codeChallengeMethod: 'plain' as unknown as 'S256',
        },
        'user-1',
      ),
    ).toThrow(/code_challenge_method "plain" refused/);
  });

  it('rejects a missing state parameter (CSRF defence)', async () => {
    const env = await makeEnv();
    const { codeChallenge } = env.createPkceChallenge();
    expect(() =>
      env.server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://app.example.test/cb',
          state: '',
          codeChallenge,
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).toThrow(/state parameter missing/);
  });

  it('rejects an unregistered redirect_uri', async () => {
    const env = await makeEnv();
    const { codeChallenge } = env.createPkceChallenge();
    expect(() =>
      env.server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://evil.example.test/cb',
          state: 's-1',
          codeChallenge,
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).toThrow(/redirect_uri "https:\/\/evil.example.test\/cb" not registered/);
  });

  it('rejects an unknown client_id / subject', async () => {
    const env = await makeEnv();
    const { codeChallenge } = env.createPkceChallenge();
    expect(() =>
      env.server.authorize(
        {
          responseType: 'code',
          clientId: 'client-unknown',
          redirectUri: 'https://app.example.test/cb',
          state: 's-1',
          codeChallenge,
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).toThrow(/unknown client_id "client-unknown"/);
    expect(() =>
      env.server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://app.example.test/cb',
          state: 's-1',
          codeChallenge,
          codeChallengeMethod: 'S256',
        },
        'user-unknown',
      ),
    ).toThrow(/unknown subject "user-unknown"/);
  });

  it('narrows scope to the intersection when the request drops entitlements', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env, {
      scope: 'profile',
    });
    const res = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(res.scope).toBe('profile');
  });

  it('rejects a scope the user is not entitled to', async () => {
    const env = await makeEnv();
    const { codeChallenge } = env.createPkceChallenge();
    expect(() =>
      env.server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://app.example.test/cb',
          state: 's-1',
          scope: 'admin',
          codeChallenge,
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).toThrow(/not entitled to scope "admin"/);
  });
});

describe('Token endpoint (/token) — authorization_code exchange', () => {
  it('mints an access + refresh token pair on a valid code_verifier', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const res = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(res.accessToken).toMatch(/^at-/);
    expect(res.refreshToken).toMatch(/^rt-/);
    expect(res.tokenType).toBe('Bearer');
    expect(res.expiresIn).toBeGreaterThan(0);
    expect(res.scope).toBe('openid profile');
  });

  it('rejects an already-consumed authorization code (replay defence)', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(() =>
      env.server.token({
        grantType: 'authorization_code',
        code,
        redirectUri: 'https://app.example.test/cb',
        clientId: 'client-A',
        codeVerifier,
      }),
    ).toThrow(/already exchanged — replay refused/);
  });

  it('rejects a mismatched code_verifier', async () => {
    const env = await makeEnv();
    const { code } = completeAuthorization(env);
    expect(() =>
      env.server.token({
        grantType: 'authorization_code',
        code,
        redirectUri: 'https://app.example.test/cb',
        clientId: 'client-A',
        codeVerifier: 'x'.repeat(43),
      }),
    ).toThrow(/PKCE code_verifier does not match/);
  });

  it('rejects a code exchanged with a different client_id', async () => {
    const env = await makeEnv();
    env.server.registerClient({
      clientId: 'client-B',
      redirectUris: ['https://other.example.test/cb'],
    });
    const { code, codeVerifier } = completeAuthorization(env);
    expect(() =>
      env.server.token({
        grantType: 'authorization_code',
        code,
        redirectUri: 'https://app.example.test/cb',
        clientId: 'client-B',
        codeVerifier,
      }),
    ).toThrow(/client_id mismatch/);
  });

  it('rejects a code exchanged with a different redirect_uri', async () => {
    const env = await makeEnv();
    // Register a second redirect for client-A so the redirect_uri is
    // acceptable at /authorize but does not match the one the code was bound
    // to at exchange time.
    env.server.registerClient({
      clientId: 'client-second',
      redirectUris: [
        'https://app.example.test/cb',
        'https://app.example.test/cb2',
      ],
      scopes: ['openid'],
    });
    env.server.registerUser({ subject: 'user-2', scopes: ['openid'] });
    const { codeVerifier, codeChallenge } = env.createPkceChallenge();
    const auth = env.server.authorize(
      {
        responseType: 'code',
        clientId: 'client-second',
        redirectUri: 'https://app.example.test/cb',
        state: 's-1',
        codeChallenge,
        codeChallengeMethod: 'S256',
      },
      'user-2',
    );
    expect(() =>
      env.server.token({
        grantType: 'authorization_code',
        code: auth.code,
        redirectUri: 'https://app.example.test/cb2',
        clientId: 'client-second',
        codeVerifier,
      }),
    ).toThrow(/redirect_uri mismatch/);
  });

  it('binds the access token to the DPoP JWK thumbprint when DPoP is supplied', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const dpop = env.createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    const res = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
      dpop,
    });
    expect(res.tokenType).toBe('DPoP');
    const [access] = env.server.listAccessTokens();
    expect(access?.dpopJkt).toBe(computeDpopJkt(dpop.header.jwk));
  });

  it('rejects grant_type=password / client_credentials / implicit outright', async () => {
    const env = await makeEnv();
    expect(() =>
      env.server.token({ grantType: 'password' } as unknown as never),
    ).toThrow(/grant_type "password" refused/);
    expect(() =>
      env.server.token({
        grantType: 'client_credentials',
      } as unknown as never),
    ).toThrow(/grant_type "client_credentials" refused/);
    expect(() =>
      env.server.token({ grantType: 'implicit' } as unknown as never),
    ).toThrow(/grant_type "implicit" refused/);
  });
});

describe('Refresh token rotation (RFC 9700 §2.2)', () => {
  it('rotates the refresh token — old is invalidated, new is issued', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    const second = env.refreshToken(first.refreshToken, 'client-A');
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(second.accessToken).not.toBe(first.accessToken);
    expect(second.scope).toBe(first.scope);
    // A second refresh with the original (now-rotated) refresh token must fail.
    expect(() => env.refreshToken(first.refreshToken, 'client-A')).toThrow(
      /has been rotated — reuse refused/,
    );
  });

  it('increments the rotationCount on every refresh', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    let currentRefresh = first.refreshToken;
    for (let i = 1; i <= 3; i += 1) {
      const next = env.refreshToken(currentRefresh, 'client-A');
      const active = env.server
        .listRefreshTokens()
        .find((rt) => rt.token === next.refreshToken);
      expect(active?.rotationCount).toBe(i);
      currentRefresh = next.refreshToken;
    }
  });

  it('narrows the scope on refresh but rejects widening', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    const narrower = env.server.token({
      grantType: 'refresh_token',
      refreshToken: first.refreshToken,
      clientId: 'client-A',
      scope: 'profile',
    });
    expect(narrower.scope).toBe('profile');
    expect(() =>
      env.server.token({
        grantType: 'refresh_token',
        refreshToken: narrower.refreshToken,
        clientId: 'client-A',
        scope: 'admin',
      }),
    ).toThrow(/refresh scope "admin" not in original grant/);
  });

  it('rejects a refresh with the wrong client_id', async () => {
    const env = await makeEnv();
    env.server.registerClient({
      clientId: 'client-B',
      redirectUris: ['https://b.example.test/cb'],
    });
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(() => env.refreshToken(first.refreshToken, 'client-B')).toThrow(
      /client_id mismatch/,
    );
  });

  it('preserves DPoP binding across a rotation and rejects mismatched keys', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const boundDpop = env.createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
      dpop: boundDpop,
    });
    // Reusing the same JWK across the refresh works. Fresh jti to avoid replay.
    const refreshDpop = env.createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
      jwk: boundDpop.header.jwk,
    });
    const second = env.refreshToken(first.refreshToken, 'client-A', refreshDpop);
    expect(second.tokenType).toBe('DPoP');
    // A different DPoP key must be refused.
    const wrongKeyDpop = env.createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    expect(() =>
      env.refreshToken(second.refreshToken, 'client-A', wrongKeyDpop),
    ).toThrow(/DPoP JWK thumbprint mismatch/);
  });

  it('rejects a refresh without DPoP when the token is DPoP-bound', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const dpop = env.createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
      dpop,
    });
    expect(() => env.refreshToken(first.refreshToken, 'client-A')).toThrow(
      /DPoP-bound but no DPoP proof/,
    );
  });
});

describe('Revocation (/revoke) — RFC 7009', () => {
  it('revokes an access token — introspect reports active=false', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    env.server.revoke(first.accessToken, 'client-A');
    expect(env.server.introspect(first.accessToken).active).toBe(false);
  });

  it('revokes a refresh token — subsequent refresh refuses', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    env.server.revoke(first.refreshToken, 'client-A');
    expect(() => env.refreshToken(first.refreshToken, 'client-A')).toThrow(
      /is revoked/,
    );
  });

  it('silently succeeds on unknown tokens per RFC 7009 §2.2', async () => {
    const env = await makeEnv();
    expect(() => env.server.revoke('unknown-token', 'client-A')).not.toThrow();
  });

  it('rejects cross-client revocation attempts', async () => {
    const env = await makeEnv();
    env.server.registerClient({
      clientId: 'client-B',
      redirectUris: ['https://b.example.test/cb'],
    });
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(() => env.server.revoke(first.accessToken, 'client-B')).toThrow(
      /revocation attempted by "client-B"/,
    );
  });
});

describe('Introspection (/introspect) — RFC 7662', () => {
  it('returns active=true with subject, scope, client for a live access token', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    const intro = env.server.introspect(first.accessToken);
    expect(intro.active).toBe(true);
    expect(intro.sub).toBe('user-1');
    expect(intro.clientId).toBe('client-A');
    expect(intro.scope).toBe('openid profile');
    expect(intro.tokenType).toBe('Bearer');
  });

  it('returns active=false for a revoked refresh token', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    env.server.revoke(first.refreshToken, 'client-A');
    expect(env.server.introspect(first.refreshToken).active).toBe(false);
  });

  it('returns active=false for an unknown token', async () => {
    const env = await makeEnv();
    expect(env.server.introspect('nowhere').active).toBe(false);
  });

  it('reports active=false once the access token expires', async () => {
    let currentMillis = 1_700_000_000 * 1000;
    const env = await setupOAuth21Env({
      issuer: 'https://as.example.test',
      clients: [
        {
          clientId: 'client-A',
          redirectUris: ['https://app.example.test/cb'],
          scopes: ['openid'],
        },
      ],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
      accessTokenLifetimeSec: 1,
      now: () => currentMillis,
    });
    envs.push(env);
    const { codeVerifier, codeChallenge } = env.createPkceChallenge();
    const authRes = env.server.authorize(
      {
        responseType: 'code',
        clientId: 'client-A',
        redirectUri: 'https://app.example.test/cb',
        state: 's-1',
        codeChallenge,
        codeChallengeMethod: 'S256',
      },
      'user-1',
    );
    const first = env.server.token({
      grantType: 'authorization_code',
      code: authRes.code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(env.server.introspect(first.accessToken).active).toBe(true);
    currentMillis += 5000;
    expect(env.server.introspect(first.accessToken).active).toBe(false);
  });
});

describe('createAuthorizationServer — standalone construction', () => {
  it('registers clients and users after construction', () => {
    const as = createAuthorizationServer({ issuer: 'https://as2.example.test' });
    as.registerClient({
      clientId: 'client-C',
      redirectUris: ['https://c.example.test/cb'],
      scopes: ['openid'],
    });
    as.registerUser({ subject: 'user-2', scopes: ['openid'] });
    expect(() =>
      as.registerClient({
        clientId: 'client-C',
        redirectUris: ['https://c.example.test/cb'],
      }),
    ).toThrow(/already registered/);
    expect(() =>
      as.registerUser({ subject: 'user-2' }),
    ).toThrow(/already registered/);
  });

  it('exposes a reset() that clears every token registry', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
    env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(env.server.listAccessTokens()).toHaveLength(1);
    env.reset();
    expect(env.server.listAccessTokens()).toHaveLength(0);
    expect(env.server.listRefreshTokens()).toHaveLength(0);
  });
});
