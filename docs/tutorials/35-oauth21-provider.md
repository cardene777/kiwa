# OAuth 2.1 provider — PKCE S256, DPoP, refresh rotation, revocation in 12 min

## What you'll build

A vitest suite for an OAuth 2.1 authorization server (AS) that exercises the four spec-critical flows — PKCE-guarded authorization code exchange, DPoP-bound access tokens (RFC 9449), rotating refresh tokens (RFC 6749bis §6), and token revocation + introspection (RFC 7009 + RFC 7662). The tests never boot a real AS or issue a real DPoP proof; they drive the OAuth 2.1 endpoints through `@kiwa-test/auth` v1.21-1c's mock-shaped stubs so the same suite runs in Node.js without a Keycloak / Ory Hydra deployment or a real ES256 keypair.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-oauth21-first && cd kiwa-oauth21-first
pnpm init
pnpm add -D @kiwa-test/auth@0.1 vitest typescript @types/node
```

Add the vitest script and TypeScript configuration in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

Ship a `tsconfig.json` that matches the ESM shape `@kiwa-test/auth` exports.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

Add the OAuth 2.1 test at `tests/oauth21.test.ts`. The four sections walk exactly the shape RP teams hit — PKCE authorization code exchange, DPoP-bound access token issuance, refresh token rotation with reuse-detection, and revocation + introspection.

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  setupOAuth21Env,
  type OAuth21TestEnv,
} from '@kiwa-test/auth';

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

async function makeEnv(): Promise<OAuth21TestEnv> {
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
  envs.push(env);
  return env;
}

function completeAuthorization(env: OAuth21TestEnv): { code: string; codeVerifier: string } {
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

describe('PKCE authorization code exchange (RFC 7636 + RFC 9700 §2.1.1)', () => {
  it('mints access + refresh on a valid code_verifier', async () => {
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
    expect(res.scope).toBe('openid profile');
  });

  it('rejects response_type "token" — OAuth 2.1 drops implicit + hybrid', async () => {
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
});

describe('DPoP-bound access token (RFC 9449)', () => {
  it('binds an access token to the DPoP JWK thumbprint', async () => {
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
    expect(res.accessToken).toMatch(/^at-/);
  });

  it('rejects refresh with a DPoP JWK that differs from the bound key', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
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

describe('Refresh token rotation (RFC 6749bis §6 + RFC 9700 §2.2.4)', () => {
  it('rotates the refresh token on every use', async () => {
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
  });

  it('refuses a reused (already-rotated) refresh token', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
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

describe('Revocation + introspection (RFC 7009 + RFC 7662)', () => {
  it('revoked access token becomes active=false at /introspect', async () => {
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
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
    const env = await makeEnv();
    const { code, codeVerifier } = completeAuthorization(env);
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

  it('rejects cross-client revocation attempts', async () => {
    const env = await setupOAuth21Env({
      issuer: 'https://as.example.test',
      clients: [
        {
          clientId: 'client-A',
          redirectUris: ['https://app.example.test/cb'],
          scopes: ['openid'],
          clientType: 'public',
        },
        {
          clientId: 'client-B',
          redirectUris: ['https://other.example.test/cb'],
          scopes: ['openid'],
          clientType: 'public',
        },
      ],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });
    envs.push(env);
    const { codeVerifier, codeChallenge } = env.createPkceChallenge();
    const authRes = env.server.authorize(
      {
        responseType: 'code',
        clientId: 'client-A',
        redirectUri: 'https://app.example.test/cb',
        state: 's-1',
        scope: 'openid',
        codeChallenge,
        codeChallengeMethod: 'S256',
      },
      'user-1',
    );
    const res = env.server.token({
      grantType: 'authorization_code',
      code: authRes.code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });
    expect(() => env.server.revoke(res.accessToken, 'client-B')).toThrow(
      /cross-client revocation/,
    );
  });
});
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 10 tests in a single Node.js process, and exits green in under a second. No Keycloak, no Ory Hydra, no real ES256 keypair, no `/authorize` HTTP round-trip — `setupOAuth21Env` delivers the observable contract a real AS enforces, without the boot cost.

## Why OAuth 2.1 diverges from OAuth 2.0 on 4 axes

OAuth 2.1 (draft RFC 6749bis + RFC 9700 BCP) diverges from OAuth 2.0 on four axes that show up in every non-trivial AS test — PKCE-mandatory-everywhere, dropped grants, DPoP-bound tokens, and rotating refresh with reuse detection.

- **PKCE mandatory, `plain` refused** — OAuth 2.0 made PKCE optional for confidential clients and accepted `code_challenge_method=plain`. OAuth 2.1 makes PKCE mandatory for every client type and refuses `plain` at both the `/authorize` and `/token` endpoints. The mock refuses both at authorize time.
- **Dropped grants (implicit + password + client_credentials + hybrid)** — OAuth 2.0 shipped `response_type=token` (implicit) + `response_type=code id_token` (hybrid) + `grant_type=password` + `grant_type=client_credentials`. OAuth 2.1 drops all four for interactive user flows. The mock's `authorize()` + `token()` refuse the dropped values at type-level (`as unknown as` cast required in tests) and at runtime.
- **DPoP-bound access tokens (RFC 9449)** — OAuth 2.0 issued bearer tokens that any holder could present. OAuth 2.1 + RFC 9449 lets a client bind a token to a DPoP JWK thumbprint — the resource server checks the DPoP proof matches the bound thumbprint on every request. The mock records the thumbprint on the access token and refuses refresh with a different JWK.
- **Rotating refresh + reuse detection (RFC 9700 §2.2.4)** — OAuth 2.0 let refresh tokens live for weeks. OAuth 2.1 rotates the refresh token on every use and treats a reused (already-rotated) token as an attack signal that invalidates the whole token family. The mock's `refreshToken()` returns a new refresh token and refuses reuse.

`@kiwa-test/auth` v1.21-1c records each axis.

- **PKCE** — `env.createPkceChallenge()` returns `{ codeVerifier, codeChallenge, codeChallengeMethod: 'S256' }`. `env.server.authorize({ codeChallengeMethod: 'plain' })` throws at authorize time. `env.server.token({ codeVerifier })` verifies against the stored challenge; a mismatch throws `/PKCE code_verifier does not match/`.
- **Dropped grants** — `env.server.authorize({ responseType: 'token' })` throws `/response_type "token" refused/`. `env.server.token({ grantType: 'password' })` and `grantType: 'client_credentials'` throw `/refused/`.
- **DPoP** — `env.createDpopProof({ htm, htu })` mints a fresh proof; `env.server.token({ dpop })` binds the returned access token to the JWK thumbprint. `env.refreshToken(rt, clientId, dpop)` verifies the same JWK is presented on refresh. `computeDpopJkt(jwk)` surfaces the thumbprint for direct assertion.
- **Refresh rotation** — `env.refreshToken(rt, clientId)` returns a new `{ accessToken, refreshToken }` pair; the old refresh token is invalidated. A second call with the old refresh token throws `/has been rotated — reuse refused/`.

Three properties are load-bearing.

- **`codeChallenge` must match at token time.** `env.server.token({ codeVerifier })` re-derives the S256 hash and compares against the stored challenge. A mismatch throws `/PKCE code_verifier does not match/`, catching a client that stored the wrong verifier.
- **DPoP `jti` replay-defence.** `verifyDpopProof(proof, { seenJtis })` records the jti in the replay registry on the first use and throws `/replay detected/` on the second. The test drives both branches.
- **Refresh reuse invalidates the whole family.** `env.refreshToken(rt, clientId)` returns a new pair; the old `rt` is dead. A retry with the old `rt` throws `/has been rotated — reuse refused/`, which is the RFC 9700 §2.2.4 signal for a stolen refresh token.

## What the mock cuts down

Real OAuth 2.1 boots a Keycloak (~500 MB, ~30 s cold start) or an Ory Hydra + Postgres pair, and each test seeds a client + user + consent decision through the admin API. The mock cuts all three costs — 0 containers, 0 network, ~1 ms per test.

That matters because production bugs show up as "the AS accepted `code_challenge_method=plain` because the OAuth 2.1 flag was off" or "the DPoP-bound refresh accepted a different JWK because the thumbprint check compared strings instead of computing the JWK canonical form". The mock records both transitions, so the assertion is `expect(() => env.server.authorize({ codeChallengeMethod: 'plain' })).toThrow()` or `expect(() => env.refreshToken(rt, id, wrongKey)).toThrow(/thumbprint mismatch/)` — machine-checkable, no Keycloak.

For a full 7-axis fidelity harness that compares mock traces against a real Keycloak deployment, see `examples/dogfood-oauth21-provider` and its `quality-reports/auth/oauth21-provider.md`.

## Related

- Concept doc — [Auth protocol testing (virtual authenticator / PKCE+DPoP / id_token / discovery+federation SSOT)](../concepts/auth-protocol-testing)
- Tutorial 34 — [WebAuthn L3 + Passkey (virtual authenticator + attestation + sync fabric)](./34-webauthn-passkey)
- Tutorial 36 — [OIDC provider + Federation (Discovery + DCR + id_token + trust chain)](./36-oidc-federation)
- v1.21-1c [#850](https://github.com/cardene777/kiwa/issues/850) — OAuth 2.1 adapter landing
- v1.21-3 [#844](https://github.com/cardene777/kiwa/issues/844) — `dogfood-oauth21-provider` (the full AS dogfood this tutorial cuts down)
