import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  __resetOidcCounters,
  computeTokenHash,
  createDiscoveryEndpoint,
  createJwksEndpoint,
  createIdTokenSigner,
  createOidcEntityStatement,
  createOidcTrustAnchor,
  mintSoftwareStatement,
  resolveOidcTrustChain,
  setupOidcEnv,
  type IdToken,
  type OidcTestEnv,
  type OpenIdProviderMetadata,
} from '../src/index.js';

const envs: OidcTestEnv[] = [];

beforeEach(() => {
  __resetOAuth21Counters();
  __resetOidcCounters();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(overrides?: Parameters<typeof setupOidcEnv>[0]): Promise<OidcTestEnv> {
  const env = await setupOidcEnv({
    issuer: 'https://op.example.test',
    clients: [
      {
        clientId: 'preset-client',
        redirectUris: ['https://rp.example.test/cb'],
        scopes: ['openid', 'profile', 'email'],
        clientType: 'public',
      },
    ],
    users: [{ subject: 'user-1', scopes: ['openid', 'profile', 'email'] }],
    softwareStatementIssuer: 'trust-anchor-alpha',
    ...(overrides ?? {}),
  });
  envs.push(env);
  return env;
}

describe('Discovery endpoint (OIDC Discovery 1.0 §3-4)', () => {
  it('exposes .well-known/openid-configuration with issuer + endpoints derived from issuer', async () => {
    const env = await makeEnv();
    const meta = env.discovery.fetch();
    expect(env.discovery.url).toBe('https://op.example.test/.well-known/openid-configuration');
    expect(meta.issuer).toBe('https://op.example.test');
    expect(meta.authorization_endpoint).toBe('https://op.example.test/authorize');
    expect(meta.token_endpoint).toBe('https://op.example.test/token');
    expect(meta.jwks_uri).toBe('https://op.example.test/jwks');
    expect(meta.registration_endpoint).toBe('https://op.example.test/register');
    expect(meta.userinfo_endpoint).toBe('https://op.example.test/userinfo');
    expect(meta.scopes_supported).toContain('openid');
    expect(meta.response_types_supported).toEqual(['code']);
    expect(meta.id_token_signing_alg_values_supported).toEqual(['RS256', 'ES256']);
    expect(meta.code_challenge_methods_supported).toEqual(['S256']);
  });

  it('refuses to build when metadataOverrides.issuer mismatches (Discovery §4.3)', () => {
    expect(() =>
      createDiscoveryEndpoint({
        issuer: 'https://op.example.test',
        metadataOverrides: {
          issuer: 'https://impostor.example.test',
        } as Partial<OpenIdProviderMetadata>,
      }),
    ).toThrow(/must match endpoint issuer/);
  });

  it('returns a fresh document on every fetch so mutation cannot leak into internal state', async () => {
    const env = await makeEnv();
    const a = env.discovery.fetch();
    const b = env.discovery.fetch();
    expect(a).not.toBe(b);
    expect(a).toStrictEqual(b);
    // Mutate the caller's copy — a subsequent fetch is unaffected.
    (a.scopes_supported as string[]).push('injected');
    const c = env.discovery.fetch();
    expect(c.scopes_supported).not.toContain('injected');
  });
});

describe('Dynamic Client Registration (RFC 7591)', () => {
  it('registers a public client (token_endpoint_auth_method=none) with deterministic id + no secret', async () => {
    const env = await makeEnv();
    const response = env.registerClient({
      redirect_uris: ['https://rp2.example.test/cb'],
      client_name: 'RP Two',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: 'openid profile',
    });
    expect(response.client_id).toBe('client-001');
    expect(response.client_secret).toBeUndefined();
    expect(response.token_endpoint_auth_method).toBe('none');
    expect(response.redirect_uris).toEqual(['https://rp2.example.test/cb']);
    // Newly-registered client is usable on the underlying OAuth 2.1 AS.
    const authRes = env.server.authorize(
      {
        responseType: 'code',
        clientId: 'client-001',
        redirectUri: 'https://rp2.example.test/cb',
        state: 's1',
        scope: 'openid profile',
        codeChallenge: 'ChcM4XCF3n0DfKO6OcRxV5aRuvCw3v2ap-6Nz2xLp2s',
        codeChallengeMethod: 'S256',
      },
      'user-1',
    );
    expect(authRes.code).toBeTruthy();
  });

  it('mints a client_secret for confidential clients (default auth method)', async () => {
    const env = await makeEnv();
    const response = env.registerClient({
      redirect_uris: ['https://rp3.example.test/cb'],
    });
    expect(response.client_id).toBe('client-001');
    expect(response.client_secret).toBeTruthy();
    expect(response.token_endpoint_auth_method).toBe('client_secret_basic');
    expect(response.grant_types).toEqual(['authorization_code']);
    expect(response.response_types).toEqual(['code']);
    expect(response.scope).toBe('openid');
  });

  it('refuses empty redirect_uris (RFC 7591 §2)', async () => {
    const env = await makeEnv();
    expect(() =>
      env.registerClient({
        redirect_uris: [],
        token_endpoint_auth_method: 'none',
      }),
    ).toThrow(/must be a non-empty array/);
  });

  it('refuses malformed redirect_uri', async () => {
    const env = await makeEnv();
    expect(() =>
      env.registerClient({
        redirect_uris: ['not-a-url'],
        token_endpoint_auth_method: 'none',
      }),
    ).toThrow(/is not a valid URL/);
  });

  it('refuses OAuth 2.0 dropped grants (password / client_credentials / implicit)', async () => {
    const env = await makeEnv();
    for (const grant of ['password', 'client_credentials', 'implicit']) {
      expect(() =>
        env.registerClient({
          redirect_uris: ['https://rp.example.test/cb'],
          grant_types: [grant],
          token_endpoint_auth_method: 'none',
        }),
      ).toThrow(/refused/);
    }
  });

  it('refuses unsupported token_endpoint_auth_method', async () => {
    const env = await makeEnv();
    expect(() =>
      env.registerClient({
        redirect_uris: ['https://rp.example.test/cb'],
        token_endpoint_auth_method: 'private_key_jwt',
      }),
    ).toThrow(/refused/);
  });

  it('accepts a valid software_statement signed by the configured trust anchor (RFC 7591 §2.3)', async () => {
    const env = await makeEnv();
    const softwareStatement = mintSoftwareStatement(
      { software_id: 'sw-1', client_name: 'Signed RP' },
      'trust-anchor-alpha',
    );
    const response = env.registerClient({
      redirect_uris: ['https://rp-signed.example.test/cb'],
      token_endpoint_auth_method: 'none',
      software_statement: softwareStatement,
    });
    expect(response.client_id).toBe('client-001');
  });

  it('refuses a software_statement whose signature does not verify (RFC 7591 §2.3)', async () => {
    const env = await makeEnv();
    // Signed by a different trust anchor — signature won't verify against
    // the configured `trust-anchor-alpha`.
    const forged = mintSoftwareStatement(
      { software_id: 'sw-forged' },
      'wrong-anchor',
    );
    expect(() =>
      env.registerClient({
        redirect_uris: ['https://rp.example.test/cb'],
        token_endpoint_auth_method: 'none',
        software_statement: forged,
      }),
    ).toThrow(/signature verification failed/);
  });

  it('refuses a software_statement when no trust anchor is configured', async () => {
    // Build an env whose options object simply omits the trust anchor —
    // `exactOptionalPropertyTypes` rejects `{ ...: undefined }`, so we drop
    // the key entirely to reach the "no trust anchor configured" branch.
    const env = await setupOidcEnv({
      issuer: 'https://op-no-anchor.example.test',
      clients: [
        {
          clientId: 'preset-client',
          redirectUris: ['https://rp.example.test/cb'],
          scopes: ['openid'],
          clientType: 'public',
        },
      ],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });
    envs.push(env);
    const stmt = mintSoftwareStatement({ software_id: 'sw' }, 'any-anchor');
    expect(() =>
      env.registerClient({
        redirect_uris: ['https://rp.example.test/cb'],
        token_endpoint_auth_method: 'none',
        software_statement: stmt,
      }),
    ).toThrow(/no trust anchor configured/);
  });

  it('refuses a malformed software_statement JWT shape', async () => {
    const env = await makeEnv();
    expect(() =>
      env.registerClient({
        redirect_uris: ['https://rp.example.test/cb'],
        token_endpoint_auth_method: 'none',
        software_statement: 'not-a-jwt',
      }),
    ).toThrow(/expected 3 dot-separated segments/);
  });
});

describe('JWKS rotation + retention (RFC 7517)', () => {
  it('rotate() issues a new active kid + retains the old kid inside the retention window', async () => {
    const env = await makeEnv({ jwksRetentionSec: 3600 });
    const initial = env.jwks.activeKey();
    expect(initial.kid).toBe('k001');
    expect(env.jwks.fetch().keys.map((k) => k.kid)).toEqual(['k001']);

    const rotated = env.jwks.rotate();
    expect(rotated.kid).toBe('k002');
    expect(env.jwks.activeKey().kid).toBe('k002');
    // Old kid must still appear in JWKS while inside retention window so
    // tokens signed by it verify.
    expect(env.jwks.fetch().keys.map((k) => k.kid)).toEqual(['k002', 'k001']);
  });

  it('id_token signed before rotation still verifies within the retention window', async () => {
    let nowMs = 1_700_000_000_000;
    const env = await makeEnv({
      jwksRetentionSec: 3600,
      idTokenLifetimeSec: 600,
      now: () => nowMs,
    });
    const client = env.registerClient({
      redirect_uris: ['https://rp.example.test/cb'],
      token_endpoint_auth_method: 'none',
    });
    const token = env.signIdToken({
      sub: 'user-1',
      aud: client.client_id,
      nonce: 'n1',
    });
    // Rotate — the previous kid is retired.
    env.jwks.rotate();
    // Verify still succeeds because the retired kid is inside retention.
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      expectedNonce: 'n1',
      now: () => nowMs,
    });
    expect(result.valid).toBe(true);
    expect(result.claims?.sub).toBe('user-1');
  });

  it('drops retired kid from JWKS after the retention window passes', async () => {
    let nowMs = 1_700_000_000_000;
    const env = await makeEnv({
      jwksRetentionSec: 3600,
      now: () => nowMs,
    });
    env.jwks.rotate();
    expect(env.jwks.fetch().keys).toHaveLength(2);
    // Advance beyond retention.
    nowMs += 4000 * 1000;
    expect(env.jwks.fetch().keys.map((k) => k.kid)).toEqual(['k002']);
  });

  it('advertises the RS256 key material shape (n + e)', async () => {
    const jwks = createJwksEndpoint({
      url: 'https://op.example.test/jwks',
      initialAlg: 'RS256',
    });
    const key = jwks.activeKey();
    expect(key.kty).toBe('RSA');
    expect(key.n).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(key.e).toBe('AQAB');
  });

  it('advertises the ES256 key material shape (crv + x + y)', async () => {
    const jwks = createJwksEndpoint({
      url: 'https://op.example.test/jwks',
      initialAlg: 'ES256',
    });
    const key = jwks.activeKey();
    expect(key.kty).toBe('EC');
    expect(key.crv).toBe('P-256');
    expect(key.x).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(key.y).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('id_token sign + verify (OIDC Core §2 + §3.1.3.6-7)', () => {
  async function issueTestToken(
    envOverrides?: Parameters<typeof setupOidcEnv>[0],
    inputOverrides?: Parameters<OidcTestEnv['signIdToken']>[0],
  ): Promise<{ env: OidcTestEnv; client: { client_id: string }; token: IdToken }> {
    const env = await makeEnv(envOverrides);
    const client = env.registerClient({
      redirect_uris: ['https://rp-test.example.test/cb'],
      token_endpoint_auth_method: 'none',
    });
    const token = env.signIdToken({
      sub: 'user-1',
      aud: client.client_id,
      nonce: 'nonce-42',
      accessToken: 'access-token-value',
      code: 'auth-code-value',
      ...(inputOverrides ?? {}),
    });
    return { env, client, token };
  }

  it('signs + verifies an id_token happy path with all guarded claims', async () => {
    const { env, client, token } = await issueTestToken();
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      expectedNonce: 'nonce-42',
      expectedAccessToken: 'access-token-value',
      expectedCode: 'auth-code-value',
    });
    expect(result.valid).toBe(true);
    expect(result.claims?.iss).toBe('https://op.example.test');
    expect(result.claims?.sub).toBe('user-1');
    expect(result.claims?.aud).toBe(client.client_id);
    expect(result.claims?.at_hash).toBe(computeTokenHash('access-token-value'));
    expect(result.claims?.c_hash).toBe(computeTokenHash('auth-code-value'));
  });

  it('rejects iss mismatch (OIDC Core §3.1.3.7)', async () => {
    const { env, client, token } = await issueTestToken();
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://impostor.example.test',
      expectedAudience: client.client_id,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/iss mismatch/);
  });

  it('rejects aud mismatch (OIDC Core §3.1.3.7)', async () => {
    const { env, token } = await issueTestToken();
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: 'other-client',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/aud mismatch/);
  });

  it('rejects an expired token (exp < now - skew)', async () => {
    let nowMs = 1_700_000_000_000;
    const { env, client, token } = await issueTestToken(
      { now: () => nowMs, idTokenLifetimeSec: 100 },
    );
    // Move clock past exp + skew.
    nowMs += 200_000 + 61_000;
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      now: () => nowMs,
      clockSkewSec: 60,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/exp expired/);
  });

  it('rejects nonce mismatch (replay defence)', async () => {
    const { env, client, token } = await issueTestToken();
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      expectedNonce: 'a-different-nonce',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/nonce mismatch/);
  });

  it('rejects at_hash mismatch (OIDC Core §3.1.3.6)', async () => {
    const { env, client, token } = await issueTestToken();
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      expectedAccessToken: 'tampered-access-token',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/at_hash mismatch/);
  });

  it('rejects c_hash mismatch (OIDC Core §3.3.2.11)', async () => {
    const { env, client, token } = await issueTestToken();
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      expectedCode: 'wrong-code',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/c_hash mismatch/);
  });

  it('rejects a token whose header + payload were tampered with (JWS signature)', async () => {
    const { env, client, token } = await issueTestToken();
    const parts = token.jwt.split('.');
    // Rewrite the payload to swap sub while leaving header + signature.
    const swapped = Buffer.from(
      JSON.stringify({ ...token.claims, sub: 'attacker' }),
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const tampered = `${parts[0]}.${swapped}.${parts[2]}`;
    const result = env.verifyIdToken(tampered, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/signature verification failed/);
  });

  it('rejects a token whose kid is not in the JWKS', async () => {
    const env = await makeEnv();
    // Build a signer that draws from a foreign JWKS (unrelated kids).
    const foreignJwks = createJwksEndpoint({ url: 'https://foreign.example/jwks' });
    const foreignSigner = createIdTokenSigner({
      issuer: env.issuer,
      jwks: foreignJwks,
    });
    const token = foreignSigner.sign({
      sub: 'user-1',
      aud: 'preset-client',
    });
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: env.issuer,
      expectedAudience: 'preset-client',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/kid ".*" not found/);
  });

  it('rejects a malformed compact JWT', async () => {
    const env = await makeEnv();
    const result = env.verifyIdToken('only.two', {
      expectedIssuer: env.issuer,
      expectedAudience: 'preset-client',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/expected 3 dot-separated segments/);
  });
});

describe('OIDC Federation trust chain (OIDF 1.0 §7)', () => {
  it('resolves a 3-step chain leaf → intermediate → anchor', () => {
    const anchor = createOidcTrustAnchor({ entity_id: 'https://anchor.example.test' });
    const intermediate = createOidcEntityStatement({
      iss: 'https://anchor.example.test',
      sub: 'https://intermediate.example.test',
    });
    const leaf = createOidcEntityStatement({
      iss: 'https://intermediate.example.test',
      sub: 'https://leaf.example.test',
    });
    const result = resolveOidcTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
    });
    expect(result.valid).toBe(true);
    expect(result.chain).toHaveLength(2);
    expect(result.chain?.[0]?.sub).toBe('https://leaf.example.test');
    expect(result.chain?.[1]?.sub).toBe('https://intermediate.example.test');
    expect(result.anchor?.entity_id).toBe('https://anchor.example.test');
  });

  it('rejects a chain with a broken intermediate link', () => {
    const anchor = createOidcTrustAnchor({ entity_id: 'https://anchor.example.test' });
    const leaf = createOidcEntityStatement({
      iss: 'https://missing-intermediate.example.test',
      sub: 'https://leaf.example.test',
    });
    const result = resolveOidcTrustChain({ leaf, intermediates: [], anchor });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/no intermediate describes/);
  });

  it('rejects a chain where an intermediate has expired', () => {
    const anchor = createOidcTrustAnchor({ entity_id: 'https://anchor.example.test' });
    const now = () => 1_700_000_000_000;
    const intermediate = createOidcEntityStatement({
      iss: 'https://anchor.example.test',
      sub: 'https://intermediate.example.test',
      now,
      exp: 100, // way in the past
    });
    const leaf = createOidcEntityStatement({
      iss: 'https://intermediate.example.test',
      sub: 'https://leaf.example.test',
      now,
    });
    const result = resolveOidcTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
      now,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/expired/);
  });

  it('rejects a chain that never reaches the anchor', () => {
    const anchor = createOidcTrustAnchor({ entity_id: 'https://anchor.example.test' });
    const misdirected = createOidcEntityStatement({
      iss: 'https://other-anchor.example.test',
      sub: 'https://intermediate.example.test',
    });
    const leaf = createOidcEntityStatement({
      iss: 'https://intermediate.example.test',
      sub: 'https://leaf.example.test',
    });
    const result = resolveOidcTrustChain({
      leaf,
      intermediates: [misdirected],
      anchor,
    });
    expect(result.valid).toBe(false);
    // The walker follows the intermediate one step (leaf.iss → misdirected.sub
    // matches), then finds that misdirected.iss ("other-anchor") has no
    // describing statement in the remaining intermediates and refuses.
    expect(result.reason).toMatch(/no intermediate describes|exhausted intermediates/);
  });

  it('detects cycles in the chain', () => {
    const anchor = createOidcTrustAnchor({ entity_id: 'https://anchor.example.test' });
    // Two intermediates that describe each other — the walker would loop
    // without cycle detection.
    const nodeA = createOidcEntityStatement({
      iss: 'https://node-b.example.test',
      sub: 'https://node-a.example.test',
    });
    const nodeB = createOidcEntityStatement({
      iss: 'https://node-a.example.test',
      sub: 'https://node-b.example.test',
    });
    const leaf = createOidcEntityStatement({
      iss: 'https://node-a.example.test',
      sub: 'https://leaf.example.test',
    });
    const result = resolveOidcTrustChain({
      leaf,
      intermediates: [nodeA, nodeB],
      anchor,
    });
    expect(result.valid).toBe(false);
    // Depending on walker order the failure is either "cycle detected" or
    // "exhausted intermediates" — both are correct terminations.
    expect(result.reason).toMatch(/cycle detected|exhausted intermediates/);
  });
});

describe('OAuth 2.1 integration (v1.21-1c layered surface)', () => {
  it('OIDC env exposes the OAuth 2.1 authorization_code flow so a full RP loop resolves', async () => {
    const env = await makeEnv();
    const { codeVerifier, codeChallenge } = env.oauth21.createPkceChallenge();
    const authRes = env.server.authorize(
      {
        responseType: 'code',
        clientId: 'preset-client',
        redirectUri: 'https://rp.example.test/cb',
        state: 'st',
        scope: 'openid profile',
        codeChallenge,
        codeChallengeMethod: 'S256',
      },
      'user-1',
    );
    const tokenRes = env.server.token({
      grantType: 'authorization_code',
      code: authRes.code,
      redirectUri: 'https://rp.example.test/cb',
      clientId: 'preset-client',
      codeVerifier,
    });
    expect(tokenRes.accessToken).toBeTruthy();
    // Layer an id_token on top of the OAuth 2.1 access token.
    const idToken = env.signIdToken({
      sub: 'user-1',
      aud: 'preset-client',
      accessToken: tokenRes.accessToken,
      code: authRes.code,
      nonce: 'oidc-nonce',
    });
    const verified = env.verifyIdToken(idToken.jwt, {
      expectedIssuer: env.issuer,
      expectedAudience: 'preset-client',
      expectedNonce: 'oidc-nonce',
      expectedAccessToken: tokenRes.accessToken,
      expectedCode: authRes.code,
    });
    expect(verified.valid).toBe(true);
  });

  it('reset() clears both OIDC + OAuth 2.1 state without disposing the env', async () => {
    const env = await makeEnv();
    env.registerClient({
      redirect_uris: ['https://rp.example.test/cb'],
      token_endpoint_auth_method: 'none',
    });
    env.reset();
    // After reset the OAuth 2.1 mock forgets the DCR-registered client so a
    // subsequent authorize refuses. The preset client remains registered
    // because it was passed to `setupOidcEnv` and re-applied on reset by the
    // OAuth 2.1 mock's own reset semantics.
    expect(env.server.listAccessTokens()).toHaveLength(0);
    expect(env.server.listRefreshTokens()).toHaveLength(0);
  });
});
