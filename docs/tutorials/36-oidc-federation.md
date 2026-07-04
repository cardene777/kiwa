# OIDC provider + Federation — Discovery, DCR, id_token verify, trust chain in 12 min

## What you'll build

A vitest suite for an OpenID Provider (OP) that exercises the four spec-critical surfaces — Discovery 1.0 metadata, RFC 7591 Dynamic Client Registration (DCR), `id_token` sign + verify with `at_hash` / `c_hash` / `nonce` guards (OIDC Core §2 + §3.1.3.6-7), and OpenID Federation 1.0 §7 trust-chain resolution. The tests never boot a real OP or fetch a real trust anchor; they drive the endpoints through `@kiwa-test/auth` v1.21-1d's mock-shaped stubs so the same suite runs in Node.js without a Keycloak deployment or a Federation trust anchor URL.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-oidc-first && cd kiwa-oidc-first
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

Add the OIDC test at `tests/oidc.test.ts`. The four sections walk exactly the shape RP teams hit — Discovery metadata, DCR + `software_statement` JWS verification, `id_token` sign + verify with claim / hash / nonce guards, and Federation trust-chain resolution.

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  __resetOidcCounters,
  createOidcEntityStatement,
  createOidcTrustAnchor,
  mintSoftwareStatement,
  resolveOidcTrustChain,
  setupOidcEnv,
  type OidcTestEnv,
} from '@kiwa-test/auth';

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

async function makeEnv(): Promise<OidcTestEnv> {
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
  envs.push(env);
  return env;
}

describe('Discovery endpoint (OIDC Discovery 1.0 §3-4)', () => {
  it('exposes .well-known/openid-configuration with issuer + endpoints', async () => {
    const env = await makeEnv();
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
    const env = await makeEnv();
    const a = env.discovery.fetch();
    (a.scopes_supported as string[]).push('injected');
    const b = env.discovery.fetch();
    expect(b.scopes_supported).not.toContain('injected');
  });
});

describe('Dynamic Client Registration (RFC 7591)', () => {
  it('registers a public client with token_endpoint_auth_method=none', async () => {
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
  });

  it('mints a client_secret for confidential clients (default auth method)', async () => {
    const env = await makeEnv();
    const response = env.registerClient({
      redirect_uris: ['https://rp3.example.test/cb'],
    });
    expect(response.client_secret).toBeTruthy();
    expect(response.token_endpoint_auth_method).toBe('client_secret_basic');
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

  it('accepts a software_statement signed by the configured trust anchor', async () => {
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

  it('refuses a software_statement whose signature does not verify', async () => {
    const env = await makeEnv();
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

describe('id_token sign + verify (OIDC Core §2 + §3.1.3.6-7)', () => {
  it('signs + verifies an id_token happy path with all guarded claims', async () => {
    const env = await makeEnv();
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
    const env = await makeEnv();
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
    const env = await makeEnv();
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
    const env = await makeEnv();
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

describe('JWKS rotation + retention (RFC 7517)', () => {
  it('id_token signed before rotation still verifies within the retention window', async () => {
    let nowMs = 1_700_000_000_000;
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
    envs.push(env);
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
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 14 tests in a single Node.js process, and exits green in under a second. No Keycloak, no `.well-known` HTTP round-trip, no Federation trust anchor URL — `setupOidcEnv` + `resolveOidcTrustChain` deliver the observable contract a real OP + trust anchor enforce, without the boot cost.

## Why OIDC + Federation diverges from OAuth 2.1 on 4 axes

OIDC Core + Discovery + DCR + Federation diverges from bare OAuth 2.1 on four axes that show up in every non-trivial OP test — Discovery metadata, DCR + `software_statement` JWS, `id_token` claim / hash / nonce guards, and Federation trust-chain resolution.

- **Discovery metadata** — OAuth 2.1 has no discovery contract; each RP must know the endpoints out-of-band. OIDC Discovery 1.0 §3-4 requires `.well-known/openid-configuration` with `issuer` / `authorization_endpoint` / `token_endpoint` / `jwks_uri` / `registration_endpoint`. The mock returns a fresh document on every fetch so mutation on the caller's copy cannot leak into internal state.
- **DCR + software_statement JWS** — RFC 7591 lets an RP self-register through `/register` with a `redirect_uris` list + optional `software_statement` (a JWS-signed claim set attesting the RP is registered with a trust anchor). The mock's `registerClient()` refuses OAuth 2.0 dropped grants (`password` / `client_credentials` / `implicit`), refuses unsupported `token_endpoint_auth_method`, and refuses a `software_statement` whose signature does not verify against the configured trust anchor.
- **id_token claim + hash + nonce guards** — OIDC Core §2 defines the `id_token` claims (`iss` / `sub` / `aud` / `exp` / `iat` / `nonce` / `at_hash` / `c_hash`). §3.1.3.7 mandates `iss` / `aud` / `exp` guards; §3.1.3.6 mandates `at_hash` binds the id_token to the access token; §3.3.2.11 mandates `c_hash` binds the id_token to the authorization code. The mock's `verifyIdToken()` returns `{ valid, reason, claims }` on every case.
- **Federation trust chain (OIDF 1.0 §7)** — Federation lets a leaf entity chain up through N intermediates to a trust anchor, with each intermediate signing a JWS-shaped entity statement about the next. The chain walker refuses broken links, expired intermediates, chains that never reach the anchor, and cycles between intermediates.

`@kiwa-test/auth` v1.21-1d records each axis.

- **Discovery** — `env.discovery.fetch()` returns the OpenID Provider metadata. `env.discovery.url` returns the well-known URL. Metadata overrides that mismatch `issuer` throw at construction time.
- **DCR** — `env.registerClient({ redirect_uris, ... })` returns `{ client_id, client_secret?, token_endpoint_auth_method, ... }`. Dropped grants throw at register time. `mintSoftwareStatement({ software_id }, 'trust-anchor-alpha')` produces a JWS; `env.registerClient({ software_statement: forged })` throws `/signature verification failed/` when the trust anchor does not match.
- **id_token** — `env.signIdToken({ sub, aud, nonce, accessToken, code })` returns `{ jwt, claims }`. `env.verifyIdToken(jwt, { expectedIssuer, expectedAudience, expectedNonce, expectedAccessToken, expectedCode })` returns `{ valid, reason, claims }` — each expected-* mismatch surfaces a specific `reason` string (`/iss mismatch/`, `/aud mismatch/`, `/nonce mismatch/`, `/at_hash mismatch/`, `/c_hash mismatch/`, `/exp expired/`, `/signature verification failed/`).
- **Federation** — `createOidcTrustAnchor({ entity_id })` mints an anchor. `createOidcEntityStatement({ iss, sub, exp?, now? })` mints an entity statement. `resolveOidcTrustChain({ leaf, intermediates, anchor, now? })` walks the chain and returns `{ valid, chain?, anchor?, reason? }` — the reason surfaces `/no intermediate describes/`, `/expired/`, `/exhausted intermediates/`, or `/cycle detected/`.

Three properties are load-bearing.

- **`kid` inside JWKS retention window still verifies.** `env.jwks.rotate()` retires the current kid but keeps it inside the JWKS document for `jwksRetentionSec` (RFC 7517 rotation grace). A token signed before the rotate still verifies via the retired kid; a token whose kid is neither active nor retained throws `/kid not in JWKS/`.
- **`at_hash` binds id_token to access token.** `computeTokenHash(accessToken)` returns the left-half SHA-256 base64url — the id_token's `at_hash` claim. `verifyIdToken({ expectedAccessToken })` re-derives the hash and compares. A tampered access token surfaces at verify time, catching a stolen bearer.
- **Federation walker refuses cycles.** Two intermediates that describe each other (A.iss=B / B.iss=A) would loop the walker without cycle detection. `resolveOidcTrustChain()` records visited entity IDs and refuses the second visit with `/cycle detected|exhausted intermediates/` — the walker terminates deterministically.

## What the mock cuts down

Real OIDC + Federation boots a Keycloak (~500 MB, ~30 s cold start) + a Federation trust anchor URL (an out-of-band HTTPS server with published JWKS), and each test seeds a client + user + trust anchor JWS through the admin API. The mock cuts all three costs — 0 containers, 0 network, ~1 ms per test.

That matters because production bugs show up as "the id_token verified because the `at_hash` check was skipped when `accessToken` was not passed" or "the Federation walker accepted a chain where the intermediate was expired because the exp check compared strings instead of timestamps". The mock records both transitions, so the assertion is `expect(result.valid).toBe(false)` + `expect(result.reason).toMatch(/at_hash mismatch/)` or `expect(result.reason).toMatch(/expired/)` — machine-checkable, no Keycloak.

For a full 16-axis fidelity harness that compares mock traces against a real Keycloak + Federation trust anchor, see `examples/dogfood-oidc-federation` and its `docs/quality-reports/auth/oidc-federation.md`.

## Related

- Concept doc — [Auth protocol testing (virtual authenticator / PKCE+DPoP / id_token / discovery+federation SSOT)](../concepts/auth-protocol-testing)
- Tutorial 34 — [WebAuthn L3 + Passkey (virtual authenticator + attestation + sync fabric)](./34-webauthn-passkey)
- Tutorial 35 — [OAuth 2.1 provider (PKCE + DPoP + refresh rotation + revocation)](./35-oauth21-provider)
- v1.21-1d [#851](https://github.com/cardene777/kiwa/issues/851) — OIDC adapter landing
- v1.21-4 [#845](https://github.com/cardene777/kiwa/issues/845) — `dogfood-oidc-federation` (the full OP dogfood this tutorial cuts down)
