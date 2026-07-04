/**
 * v1.21-5 docs 補強 (Issue #846) — tutorial 34-36 code snippet 検証。
 *
 * `docs/tutorials/34-webauthn-passkey.md` /
 * `docs/tutorials/35-oauth21-provider.md` /
 * `docs/tutorials/36-oidc-federation.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20
 * の docs-tutorial-v*.test.ts と同 pattern。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  __resetOidcCounters,
  __resetPasskeyCounters,
  __resetWebAuthnCounters,
  createOidcEntityStatement,
  createOidcTrustAnchor,
  mintSoftwareStatement,
  resolveOidcTrustChain,
  setupOAuth21Env,
  setupOidcEnv,
  setupPasskeyEnv,
  setupWebAuthnEnv,
  type OAuth21TestEnv,
  type OidcTestEnv,
  type PasskeyTestEnv,
  type WebAuthnTestEnv,
} from '../src/index.js';

const webauthnEnvs: WebAuthnTestEnv[] = [];
const passkeyEnvs: PasskeyTestEnv[] = [];
const oauthEnvs: OAuth21TestEnv[] = [];
const oidcEnvs: OidcTestEnv[] = [];

beforeEach(() => {
  __resetWebAuthnCounters();
  __resetPasskeyCounters();
  __resetOAuth21Counters();
  __resetOidcCounters();
});

afterEach(async () => {
  while (webauthnEnvs.length > 0) {
    const env = webauthnEnvs.pop();
    if (env) await env.stop();
  }
  while (passkeyEnvs.length > 0) {
    const env = passkeyEnvs.pop();
    if (env) await env.stop();
  }
  while (oauthEnvs.length > 0) {
    const env = oauthEnvs.pop();
    if (env) await env.stop();
  }
  while (oidcEnvs.length > 0) {
    const env = oidcEnvs.pop();
    if (env) await env.stop();
  }
});

// ---------------------------------------------------------------------------
// Tutorial 34 — WebAuthn L3 + Passkey
// ---------------------------------------------------------------------------

describe('tutorial 34 — virtual authenticator mount (1st snippet)', () => {
  it('mounts a platform authenticator with internal transport + resident key + UV', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    webauthnEnvs.push(env);
    expect(env.authenticators).toHaveLength(1);
    expect(env.authenticators[0]!.attachment).toBe('platform');
    expect(env.authenticators[0]!.transport).toBe('internal');
    expect(env.mode).toBe('mock');
  });

  it('rejects platform attachment paired with a non-internal transport', async () => {
    await expect(
      setupWebAuthnEnv({
        authenticators: [{ attachment: 'platform', transport: 'usb' }],
      }),
    ).rejects.toThrow(/platform attachment requires internal transport/);
  });
});

describe('tutorial 34 — credential creation + attestation (2nd snippet)', () => {
  it('produces an attestationObject for each of the 4 attestation modes', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    webauthnEnvs.push(env);
    const modes = ['none', 'indirect', 'direct', 'enterprise'] as const;
    for (const attestation of modes) {
      const response = await env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: `user-${attestation}`, name: 'alice', displayName: 'Alice' },
        challenge: `challenge-${attestation}`,
        attestation,
      });
      expect(response.attestation).toBe(attestation);
      expect(response.credentialId).toMatch(/^credential-\d+$/);
      expect(response.attachment).toBe('platform');
    }
    expect(env.listCredentials()).toHaveLength(4);
  });

  it('creates a discoverable credential when residentKey=required', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    webauthnEnvs.push(env);
    const response = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-1',
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    });
    expect(env.getCredential(response.credentialId)?.discoverable).toBe(true);
  });
});

describe('tutorial 34 — credential assertion + signCount (3rd snippet)', () => {
  it('bumps signCount monotonically on every assertion', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    webauthnEnvs.push(env);
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    const first = await env.credentialAssertion({
      rpId: 'example.test',
      challenge: 'challenge-get-1',
    });
    const second = await env.credentialAssertion({
      rpId: 'example.test',
      challenge: 'challenge-get-2',
    });
    expect(first.signCount).toBe(1);
    expect(second.signCount).toBe(2);
    expect(second.signCount).toBeGreaterThan(first.signCount);
  });

  it('rejects userVerification=required against an authenticator without UV', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'cross-platform',
          transport: 'usb',
          hasResidentKey: true,
          hasUserVerification: false,
        },
      ],
    });
    webauthnEnvs.push(env);
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    await expect(
      env.credentialAssertion({
        rpId: 'example.test',
        challenge: 'challenge-get',
        userVerification: 'required',
      }),
    ).rejects.toThrow(/userVerification=required but authenticator does not support user verification/);
  });
});

describe('tutorial 34 — Passkey sync fabric backup + restore (4th snippet)', () => {
  it('backs up a Passkey into iCloud Keychain and restores it onto a fresh device', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'macbook-old', platform: { biometric: 'touch-id' } },
        { deviceId: 'macbook-new', platform: { biometric: 'touch-id' } },
      ],
    });
    passkeyEnvs.push(env);
    const created = await env.createPasskey('macbook-old', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    env.backupCredential(created.credentialId, 'icloud-keychain');
    env.removeDevice('macbook-old');
    const restored = env.restoreCredential(
      'macbook-new',
      'user-1',
      created.credentialId,
      'icloud-keychain',
    );
    expect(restored.credentialId).toBe(created.credentialId);
    expect(restored.originDeviceId).toBe('macbook-old');
    const assertion = await env.authenticate('macbook-new', {
      rpId: 'example.test',
      challenge: 'c-post-restore',
    });
    expect(assertion.credentialId).toBe(created.credentialId);
    expect(assertion.signCount).toBe(1);
  });

  it('rejects backup of a non-backup-eligible security-key credential', async () => {
    const env = await setupPasskeyEnv({
      devices: [{ deviceId: 'ykey-1', roaming: { kind: 'security-key' } }],
    });
    passkeyEnvs.push(env);
    const created = await env.createPasskey('ykey-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    expect(() => env.backupCredential(created.credentialId, 'icloud-keychain')).toThrow(
      /is not backup-eligible/,
    );
  });
});

// ---------------------------------------------------------------------------
// Tutorial 35 — OAuth 2.1 provider
// ---------------------------------------------------------------------------

async function makeOAuthEnv(): Promise<OAuth21TestEnv> {
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
    users: [{ subject: 'user-1', scopes: ['openid', 'profile', 'email'] }],
  });
  oauthEnvs.push(env);
  return env;
}

function completeOAuthAuthorization(env: OAuth21TestEnv): { code: string; codeVerifier: string } {
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
    },
    'user-1',
  );
  return { code: authRes.code, codeVerifier };
}

describe('tutorial 35 — PKCE authorization code exchange (1st snippet)', () => {
  it('mints access + refresh on a valid code_verifier', async () => {
    const env = await makeOAuthEnv();
    const { code, codeVerifier } = completeOAuthAuthorization(env);
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
    expect(res.scope).toBe('openid profile');
  });

  it('rejects response_type "token" — OAuth 2.1 drops implicit + hybrid', async () => {
    const env = await makeOAuthEnv();
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
    const env = await makeOAuthEnv();
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

  it('rejects an already-consumed authorization code (replay defence)', async () => {
    const env = await makeOAuthEnv();
    const { code, codeVerifier } = completeOAuthAuthorization(env);
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
});

describe('tutorial 35 — DPoP-bound access token (2nd snippet)', () => {
  it('binds an access token to the DPoP JWK thumbprint', async () => {
    const env = await makeOAuthEnv();
    const { code, codeVerifier } = completeOAuthAuthorization(env);
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
    expect(res.accessToken).toMatch(/^at-/);
  });

  it('rejects refresh with a DPoP JWK that differs from the bound key', async () => {
    const env = await makeOAuthEnv();
    const { code, codeVerifier } = completeOAuthAuthorization(env);
    const bound = env.createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
      dpop: bound,
    });
    const wrongKey = env.createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.test/token',
    });
    expect(() =>
      env.refreshToken(first.refreshToken, 'client-A', wrongKey),
    ).toThrow(/DPoP JWK thumbprint mismatch/);
  });
});

describe('tutorial 35 — Refresh token rotation (3rd snippet)', () => {
  it('rotates the refresh token on every use', async () => {
    const env = await makeOAuthEnv();
    const { code, codeVerifier } = completeOAuthAuthorization(env);
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
  });

  it('refuses a reused (already-rotated) refresh token', async () => {
    const env = await makeOAuthEnv();
    const { code, codeVerifier } = completeOAuthAuthorization(env);
    const first = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    env.refreshToken(first.refreshToken, 'client-A');
    expect(() => env.refreshToken(first.refreshToken, 'client-A')).toThrow(
      /has been rotated — reuse refused/,
    );
  });
});

describe('tutorial 35 — Revocation + introspection (4th snippet)', () => {
  it('revoked access token becomes active=false at /introspect', async () => {
    const env = await makeOAuthEnv();
    const { code, codeVerifier } = completeOAuthAuthorization(env);
    const res = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(env.server.introspect(res.accessToken).active).toBe(true);
    env.server.revoke(res.accessToken, 'client-A');
    expect(env.server.introspect(res.accessToken).active).toBe(false);
  });

  it('revoked refresh token refuses subsequent refresh', async () => {
    const env = await makeOAuthEnv();
    const { code, codeVerifier } = completeOAuthAuthorization(env);
    const res = env.server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    env.server.revoke(res.refreshToken, 'client-A');
    expect(() => env.refreshToken(res.refreshToken, 'client-A')).toThrow(
      /is revoked/,
    );
  });
});

// ---------------------------------------------------------------------------
// Tutorial 36 — OIDC provider + Federation
// ---------------------------------------------------------------------------

async function makeOidcEnv(): Promise<OidcTestEnv> {
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
  });
  oidcEnvs.push(env);
  return env;
}

describe('tutorial 36 — Discovery endpoint (1st snippet)', () => {
  it('exposes .well-known/openid-configuration with issuer + endpoints', async () => {
    const env = await makeOidcEnv();
    const meta = env.discovery.fetch();
    expect(env.discovery.url).toBe(
      'https://op.example.test/.well-known/openid-configuration',
    );
    expect(meta.issuer).toBe('https://op.example.test');
    expect(meta.authorization_endpoint).toBe('https://op.example.test/authorize');
    expect(meta.token_endpoint).toBe('https://op.example.test/token');
    expect(meta.jwks_uri).toBe('https://op.example.test/jwks');
    expect(meta.registration_endpoint).toBe('https://op.example.test/register');
    expect(meta.response_types_supported).toEqual(['code']);
    expect(meta.code_challenge_methods_supported).toEqual(['S256']);
  });

  it('returns a fresh document on every fetch (mutation cannot leak)', async () => {
    const env = await makeOidcEnv();
    const a = env.discovery.fetch();
    (a.scopes_supported as string[]).push('injected');
    const b = env.discovery.fetch();
    expect(b.scopes_supported).not.toContain('injected');
  });
});

describe('tutorial 36 — Dynamic Client Registration (2nd snippet)', () => {
  it('registers a public client with token_endpoint_auth_method=none', async () => {
    const env = await makeOidcEnv();
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
  });

  it('mints a client_secret for confidential clients (default auth method)', async () => {
    const env = await makeOidcEnv();
    const response = env.registerClient({
      redirect_uris: ['https://rp3.example.test/cb'],
    });
    expect(response.client_secret).toBeTruthy();
    expect(response.token_endpoint_auth_method).toBe('client_secret_basic');
  });

  it('refuses OAuth 2.0 dropped grants (password / client_credentials / implicit)', async () => {
    const env = await makeOidcEnv();
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

  it('accepts a software_statement signed by the configured trust anchor', async () => {
    const env = await makeOidcEnv();
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

  it('refuses a software_statement whose signature does not verify', async () => {
    const env = await makeOidcEnv();
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
});

describe('tutorial 36 — id_token sign + verify (3rd snippet)', () => {
  it('signs + verifies an id_token happy path with all guarded claims', async () => {
    const env = await makeOidcEnv();
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
    });
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
  });

  it('rejects iss mismatch (OIDC Core §3.1.3.7)', async () => {
    const env = await makeOidcEnv();
    const client = env.registerClient({
      redirect_uris: ['https://rp-test.example.test/cb'],
      token_endpoint_auth_method: 'none',
    });
    const token = env.signIdToken({ sub: 'user-1', aud: client.client_id });
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://impostor.example.test',
      expectedAudience: client.client_id,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/iss mismatch/);
  });

  it('rejects nonce mismatch (replay defence)', async () => {
    const env = await makeOidcEnv();
    const client = env.registerClient({
      redirect_uris: ['https://rp-test.example.test/cb'],
      token_endpoint_auth_method: 'none',
    });
    const token = env.signIdToken({
      sub: 'user-1',
      aud: client.client_id,
      nonce: 'nonce-42',
    });
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      expectedNonce: 'a-different-nonce',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/nonce mismatch/);
  });

  it('rejects at_hash mismatch (OIDC Core §3.1.3.6)', async () => {
    const env = await makeOidcEnv();
    const client = env.registerClient({
      redirect_uris: ['https://rp-test.example.test/cb'],
      token_endpoint_auth_method: 'none',
    });
    const token = env.signIdToken({
      sub: 'user-1',
      aud: client.client_id,
      accessToken: 'access-token-value',
    });
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      expectedAccessToken: 'tampered-access-token',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/at_hash mismatch/);
  });
});

describe('tutorial 36 — JWKS rotation retention (4th snippet)', () => {
  it('id_token signed before rotation still verifies within the retention window', async () => {
    const nowMs = 1_700_000_000_000;
    const env = await setupOidcEnv({
      issuer: 'https://op.example.test',
      clients: [
        {
          clientId: 'preset-client',
          redirectUris: ['https://rp.example.test/cb'],
          scopes: ['openid'],
          clientType: 'public',
        },
      ],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
      jwksRetentionSec: 3600,
      idTokenLifetimeSec: 600,
      now: () => nowMs,
    });
    oidcEnvs.push(env);
    const client = env.registerClient({
      redirect_uris: ['https://rp.example.test/cb'],
      token_endpoint_auth_method: 'none',
    });
    const token = env.signIdToken({ sub: 'user-1', aud: client.client_id, nonce: 'n1' });
    env.jwks.rotate();
    const result = env.verifyIdToken(token.jwt, {
      expectedIssuer: 'https://op.example.test',
      expectedAudience: client.client_id,
      expectedNonce: 'n1',
      now: () => nowMs,
    });
    expect(result.valid).toBe(true);
  });
});

describe('tutorial 36 — Federation trust chain (5th snippet)', () => {
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
      exp: 100,
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
});
