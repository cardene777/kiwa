/**
 * Sub-Issue v1.21-4a (op-discovery) fidelity harness.
 *
 * Diff mock vs real drivers across four fidelity axes:
 *   1. discovery metadata shape (RFC 8414 / OIDC Discovery §3 mandatory keys +
 *      OAuth 2.1 restrictions)
 *   2. discovery issuer 一致 guard (Discovery §4.3 — `issuer` field MUST match
 *      the URL used to fetch the document)
 *   3. JWKS active key shape (RFC 7517 §4 mandatory fields for RS256 / ES256)
 *   4. JWKS rotation retention (rotate mints fresh kid + retires previous key
 *      with retention window; retired keys stay observable until window
 *      expires)
 *
 * The real driver runs in env-missing mode by default (Sub-Issue v1.21-4b
 * wires Keycloak); every axis has a matching env-missing assertion so the
 * harness proves the refusal semantics without actually spawning docker.
 */

import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  type MakeMockAdapterOptions,
} from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  KIWA_OIDC_ENV_MISSING,
} from '../src/adapters/interface.js';
import {
  assertIssuerMatchesFetchUrl,
  assertOAuth21Restrictions,
  assertRequiredDiscoveryFields,
  DiscoveryIssuerMismatchError,
} from '../src/lib/discovery.js';
import {
  assertJwksDocumentShape,
  assertKeyShape,
  JwksShapeError,
  pickActiveKey,
  pickRetiredKeys,
} from '../src/lib/jwks.js';

const ISSUER = 'https://op.example.test';

describe('axis 1 — discovery metadata shape', () => {
  it('mock returns the OIDC Discovery §3 mandatory fields', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const metadata = adapter.discovery();
    expect(() => assertRequiredDiscoveryFields(metadata)).not.toThrow();
    expect(metadata.issuer).toBe(ISSUER);
    expect(metadata.authorization_endpoint).toBe(`${ISSUER}/authorize`);
    expect(metadata.token_endpoint).toBe(`${ISSUER}/token`);
    expect(metadata.jwks_uri).toBe(`${ISSUER}/jwks`);
    expect(metadata.registration_endpoint).toBe(`${ISSUER}/register`);
    expect(metadata.userinfo_endpoint).toBe(`${ISSUER}/userinfo`);
    await adapter.reset();
  });

  it('mock advertises the OAuth 2.1 restricted subsets', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const metadata = adapter.discovery();
    expect(() => assertOAuth21Restrictions(metadata)).not.toThrow();
    expect(metadata.response_types_supported).toEqual(['code']);
    expect(metadata.code_challenge_methods_supported).toEqual(['S256']);
    expect(metadata.id_token_signing_alg_values_supported).toContain('RS256');
    expect(metadata.id_token_signing_alg_values_supported).toContain('ES256');
    await adapter.reset();
  });

  it('real driver returns the same static shape even in env-missing', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    const metadata = adapter.discovery();
    expect(() => assertRequiredDiscoveryFields(metadata)).not.toThrow();
    expect(() => assertOAuth21Restrictions(metadata)).not.toThrow();
    expect(metadata.issuer).toBe(ISSUER);
    expect(metadata.response_types_supported).toEqual(['code']);
    await adapter.reset();
  });

  it('mock vs real advertise the same core fields (fidelity axis 1)', async () => {
    const mock = await makeMockAdapter({ issuer: ISSUER });
    const real = await makeRealAdapter({ issuer: ISSUER, env: {} });
    const mockMeta = mock.discovery();
    const realMeta = real.discovery();
    expect(realMeta.issuer).toBe(mockMeta.issuer);
    expect(realMeta.authorization_endpoint).toBe(mockMeta.authorization_endpoint);
    expect(realMeta.token_endpoint).toBe(mockMeta.token_endpoint);
    expect(realMeta.jwks_uri).toBe(mockMeta.jwks_uri);
    expect(realMeta.response_types_supported).toEqual(
      mockMeta.response_types_supported,
    );
    expect(realMeta.code_challenge_methods_supported).toEqual(
      mockMeta.code_challenge_methods_supported,
    );
    await mock.reset();
    await real.reset();
  });
});

describe('axis 2 — discovery issuer 一致 guard', () => {
  it('mock: assertIssuerMatchesFetchUrl passes when issuer matches fetch URL', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const metadata = adapter.discovery();
    expect(() => assertIssuerMatchesFetchUrl(metadata, ISSUER)).not.toThrow();
    await adapter.reset();
  });

  it('mock: assertIssuerMatchesFetchUrl throws when issuer diverges from fetch URL', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const metadata = adapter.discovery();
    expect(() =>
      assertIssuerMatchesFetchUrl(metadata, 'https://impostor.example.test'),
    ).toThrow(DiscoveryIssuerMismatchError);
    await adapter.reset();
  });

  it('mock: trailing slash on either side is tolerated', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const metadata = adapter.discovery();
    expect(() => assertIssuerMatchesFetchUrl(metadata, `${ISSUER}/`)).not.toThrow();
    await adapter.reset();
  });

  it('real: assertIssuerMatchesFetchUrl works on the static shape', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    const metadata = adapter.discovery();
    expect(() => assertIssuerMatchesFetchUrl(metadata, ISSUER)).not.toThrow();
    expect(() =>
      assertIssuerMatchesFetchUrl(metadata, 'https://different.example.test'),
    ).toThrow(DiscoveryIssuerMismatchError);
    await adapter.reset();
  });
});

describe('axis 3 — JWKS active key shape', () => {
  it('mock: JWKS document has exactly one active key satisfying assertKeyShape', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const document = adapter.jwks();
    expect(() => assertJwksDocumentShape(document)).not.toThrow();
    const active = pickActiveKey(document);
    expect(() => assertKeyShape(active)).not.toThrow();
    expect(active.retiredAt).toBeUndefined();
    expect(['RS256', 'ES256']).toContain(active.alg);
    await adapter.reset();
  });

  it('mock: active key advertises `use=sig` + non-empty kid', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const document = adapter.jwks();
    const active = pickActiveKey(document);
    expect(active.use).toBe('sig');
    expect(active.kid).toMatch(/^k\d{3}$/);
    await adapter.reset();
  });

  it('assertKeyShape rejects RS256 key missing n/e', () => {
    expect(() =>
      assertKeyShape({
        kid: 'k001',
        alg: 'RS256',
        kty: 'RSA',
        use: 'sig',
      }),
    ).toThrow(JwksShapeError);
  });

  it('assertKeyShape rejects ES256 key missing crv/x/y', () => {
    expect(() =>
      assertKeyShape({
        kid: 'k001',
        alg: 'ES256',
        kty: 'EC',
        use: 'sig',
      }),
    ).toThrow(JwksShapeError);
  });

  it('real: JWKS refuses with KIWA_OIDC_ENV_MISSING in env-missing state', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() => adapter.jwks()).toThrow(KIWA_OIDC_ENV_MISSING);
    const traces = adapter.traces();
    const jwksTrace = traces.find((event) => event.op === 'jwks');
    expect(jwksTrace).toBeDefined();
    expect(jwksTrace?.ok).toBe(false);
    expect(jwksTrace?.errorKind).toBe(KIWA_OIDC_ENV_MISSING);
    await adapter.reset();
  });
});

describe('axis 4 — JWKS rotation retention', () => {
  it('mock: rotate mints fresh kid + moves previous active into retired set', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const before = adapter.jwks();
    const previousActive = pickActiveKey(before);
    const previousKid = previousActive.kid;
    const rotated = adapter.rotateJwks();
    expect(rotated.kid).not.toBe(previousKid);
    expect(rotated.retiredAt).toBeUndefined();
    const after = adapter.jwks();
    const newActive = pickActiveKey(after);
    expect(newActive.kid).toBe(rotated.kid);
    const retired = pickRetiredKeys(after);
    expect(retired.map((key) => key.kid)).toContain(previousKid);
    await adapter.reset();
  });

  it('mock: rotate preserves the same alg family + all keys stay shape-valid', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const before = adapter.jwks();
    const beforeAlg = pickActiveKey(before).alg;
    adapter.rotateJwks();
    const after = adapter.jwks();
    expect(pickActiveKey(after).alg).toBe(beforeAlg);
    expect(() => assertJwksDocumentShape(after)).not.toThrow();
    await adapter.reset();
  });

  it('mock: retired keys drop once retention window elapses', async () => {
    let now = 1_700_000_000_000;
    const options: MakeMockAdapterOptions = {
      issuer: ISSUER,
      jwksRetentionSec: 60,
      now: () => now,
    };
    const adapter = await makeMockAdapter(options);
    const before = adapter.jwks();
    const previousKid = pickActiveKey(before).kid;
    adapter.rotateJwks();
    const withinWindow = adapter.jwks();
    expect(
      pickRetiredKeys(withinWindow).map((key) => key.kid),
    ).toContain(previousKid);
    // Advance beyond the retention window (60 s) to prove the retired key
    // drops out of the document.
    now += 61 * 1000;
    const afterWindow = adapter.jwks();
    expect(
      pickRetiredKeys(afterWindow).map((key) => key.kid),
    ).not.toContain(previousKid);
    await adapter.reset();
  });

  it('mock: three consecutive rotations produce three distinct kids and stable active retention', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const originalKid = pickActiveKey(adapter.jwks()).kid;
    const kid1 = adapter.rotateJwks().kid;
    const kid2 = adapter.rotateJwks().kid;
    const kid3 = adapter.rotateJwks().kid;
    const kids = new Set([originalKid, kid1, kid2, kid3]);
    expect(kids.size).toBe(4);
    const activeAfter = pickActiveKey(adapter.jwks());
    expect(activeAfter.kid).toBe(kid3);
    await adapter.reset();
  });

  it('real: rotateJwks refuses with KIWA_OIDC_ENV_MISSING', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() => adapter.rotateJwks()).toThrow(KIWA_OIDC_ENV_MISSING);
    const traces = adapter.traces();
    const rotateTrace = traces.find((event) => event.op === 'jwksRotate');
    expect(rotateTrace).toBeDefined();
    expect(rotateTrace?.ok).toBe(false);
    expect(rotateTrace?.errorKind).toBe(KIWA_OIDC_ENV_MISSING);
    await adapter.reset();
  });
});

describe('real adapter — env-missing skeleton', () => {
  it('reports env-missing for registerClient', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() =>
      adapter.registerClient({
        redirect_uris: ['https://rp.example.test/callback'],
      }),
    ).toThrow(KIWA_OIDC_ENV_MISSING);
    await adapter.reset();
  });

  it('reports discovery as ok in env-missing (static shape available)', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    adapter.discovery();
    const traces = adapter.traces();
    const discoveryTrace = traces.find((event) => event.op === 'discovery');
    expect(discoveryTrace).toBeDefined();
    expect(discoveryTrace?.ok).toBe(true);
    await adapter.reset();
  });

  it('KIWA_MODE=mock override still runs mock adapter cleanly', async () => {
    // Prove the mock is always operational — Sub-Issue v1.21-4b/c/d rely on
    // this to always have a working driver for behavioural comparison.
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const metadata = adapter.discovery();
    const document = adapter.jwks();
    expect(metadata.issuer).toBe(ISSUER);
    expect(document.keys.length).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('OIDC_BOOTSTRAP=1 without KEYCLOAK_URL still refuses (both env vars required)', async () => {
    const adapter = await makeRealAdapter({
      issuer: ISSUER,
      env: { OIDC_BOOTSTRAP: '1' },
    });
    expect(() => adapter.jwks()).toThrow(KIWA_OIDC_ENV_MISSING);
    await adapter.reset();
  });
});

describe('DCR skeleton (mock only for v1.21-4a, real refuses)', () => {
  it('mock: registerClient succeeds with minimal request', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const response = adapter.registerClient({
      redirect_uris: ['https://rp.example.test/callback'],
    });
    expect(response.client_id).toMatch(/^client-\d{3}$/);
    expect(response.redirect_uris).toEqual([
      'https://rp.example.test/callback',
    ]);
    await adapter.reset();
  });

  it('mock: registerClient refuses empty redirect_uris', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    expect(() => adapter.registerClient({ redirect_uris: [] })).toThrow();
    const traces = adapter.traces();
    const registerTraces = traces.filter(
      (event) => event.op === 'registerClient',
    );
    expect(registerTraces.length).toBeGreaterThan(0);
    const lastRegister = registerTraces[registerTraces.length - 1];
    expect(lastRegister?.ok).toBe(false);
    await adapter.reset();
  });

  it('mock: three consecutive registrations produce distinct client_ids', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const a = adapter.registerClient({
      redirect_uris: ['https://rp1.example.test/callback'],
    });
    const b = adapter.registerClient({
      redirect_uris: ['https://rp2.example.test/callback'],
    });
    const c = adapter.registerClient({
      redirect_uris: ['https://rp3.example.test/callback'],
    });
    const ids = new Set([a.client_id, b.client_id, c.client_id]);
    expect(ids.size).toBe(3);
    await adapter.reset();
  });
});
