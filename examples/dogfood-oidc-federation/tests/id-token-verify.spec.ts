/**
 * Sub-Issue v1.21-4c (id-token-verify) fidelity harness.
 *
 * Layers id_token-specific behavioural fidelity axes on top of the Sub-Issue
 * v1.21-4a skeleton + Sub-Issue v1.21-4b DCR wiring. The wrapper in
 * `src/lib/id-token.ts` sits between the RP callback path + the underlying
 * `@kiwa/auth` `verifyIdToken`. The harness exercises the four OIDC
 * Core 1.0 §3.1.3.7 + §3.1.3.6 axes —
 *
 *   1. JWS signature — kid lookup, alg match, signature recompute; tampering
 *      or wrong-kid refuses;
 *   2. claims 一致 — iss / aud / exp / iat match RP expectations within skew
 *      tolerance;
 *   3. nonce echo — authorization-request `nonce` equals `nonce` claim; missing
 *      claim when expectation is present refuses;
 *   4. hash chain — at_hash / c_hash computed as SHA-256(input)[0..15]
 *      base64url; mismatch refuses.
 *
 * Every axis maps 1:1 onto a section in
 * `docs/quality-reports/auth/oidc-federation-id-token.md`.
 */

import { describe, expect, it } from 'vitest';
import {
  computeTokenHash,
  setupOidcEnv,
  type OidcTestEnv,
} from '@kiwa/auth';
import {
  IdTokenVerifyError,
  mustVerifyIdToken,
  parseIdTokenHeader,
  verifyIdToken,
} from '../src/lib/id-token.js';

const ISSUER = 'https://op.example.test';
const RP_CLIENT_ID = 'rp-client-42';
const RP_SUBJECT = 'sub-42';

async function makeEnv(): Promise<OidcTestEnv> {
  return setupOidcEnv({ issuer: ISSUER });
}

describe('axis 1 — JWS signature', () => {
  it('accepts a freshly-signed id_token whose kid is the active JWKS key', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.claims.sub).toBe(RP_SUBJECT);
      expect(outcome.claims.aud).toBe(RP_CLIENT_ID);
    }
    await env.stop();
  });

  it('refuses when the signature segment is tampered with', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const [header, payload] = idToken.jwt.split('.');
    // Flip the last character of the signature to a different base64url char
    // so the sha256(header.payload.kid) recompute fails.
    const tampered = `${header}.${payload}.AAAA`;
    const outcome = verifyIdToken(env.verifyIdToken, tampered, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('signature');
      expect(outcome.issue.reason).toMatch(/signature/);
    }
    await env.stop();
  });

  it('refuses when the header kid is unknown to the JWKS', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const [, payload, signature] = idToken.jwt.split('.');
    // Craft a header whose kid does not correspond to any JWKS key. The
    // verifier looks up the kid across `allKeys()` — an unknown kid trips
    // the kid-lookup branch before signature recompute.
    const fakeHeader = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'unknown-kid' }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const outcome = verifyIdToken(env.verifyIdToken, `${fakeHeader}.${payload}.${signature}`, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('signature');
      expect(outcome.issue.reason).toMatch(/kid/);
    }
    await env.stop();
  });

  it('verifies a token signed by a retired-but-in-window key after rotation', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    // Rotate JWKS — the retired key stays within the retention window so a
    // token signed under its kid still verifies. This proves the wrapper +
    // underlying verifier honour the rotation retention semantics.
    env.jwks.rotate();
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(outcome.ok).toBe(true);
    await env.stop();
  });
});

describe('axis 2 — claims 一致', () => {
  it('refuses when iss mismatches the RP expectation', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: 'https://evil.example.test',
      expectedAudience: RP_CLIENT_ID,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('claims');
      expect(outcome.issue.reason).toMatch(/iss/);
    }
    await env.stop();
  });

  it('refuses when aud mismatches the RP expectation', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: 'wrong-client',
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('claims');
      expect(outcome.issue.reason).toMatch(/aud/);
    }
    await env.stop();
  });

  it('refuses when exp has passed even accounting for skew', async () => {
    let clockNow = Date.parse('2026-01-01T00:00:00Z');
    const env = await setupOidcEnv({
      issuer: ISSUER,
      now: () => clockNow,
      idTokenLifetimeSec: 60,
    });
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    // Advance the clock beyond exp + skew (60 s lifetime + 60 s skew default).
    clockNow += (60 + 60 + 1) * 1000;
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      now: () => clockNow,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('claims');
      expect(outcome.issue.reason).toMatch(/exp/);
    }
    await env.stop();
  });

  it('accepts exp within skew tolerance', async () => {
    let clockNow = Date.parse('2026-01-01T00:00:00Z');
    const env = await setupOidcEnv({
      issuer: ISSUER,
      now: () => clockNow,
      idTokenLifetimeSec: 60,
    });
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    // Advance the clock slightly past exp but within the default 60 s skew.
    clockNow += (60 + 30) * 1000;
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      now: () => clockNow,
    });
    expect(outcome.ok).toBe(true);
    await env.stop();
  });

  it('refuses when iat sits in the future beyond skew (clock-drift attack)', async () => {
    let clockNow = Date.parse('2026-01-01T00:00:00Z');
    const env = await setupOidcEnv({
      issuer: ISSUER,
      now: () => clockNow,
    });
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    // The RP verifies from a clock that is more than skew seconds behind the
    // OP — a real attacker would present a token whose iat is in the RP's
    // future.
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      now: () => clockNow - (60 + 30) * 1000,
      clockSkewSec: 30,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('claims');
      expect(outcome.issue.reason).toMatch(/iat/);
    }
    await env.stop();
  });
});

describe('axis 3 — nonce echo', () => {
  it('accepts a token whose nonce echoes the authorization request', async () => {
    const env = await makeEnv();
    const nonce = 'nonce-abc-123';
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID, nonce });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      expectedNonce: nonce,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.claims.nonce).toBe(nonce);
    }
    await env.stop();
  });

  it('refuses when nonce claim mismatches the RP expectation (replay indicator)', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID, nonce: 'nonce-A' });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      expectedNonce: 'nonce-B',
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('nonce');
      expect(outcome.issue.reason).toMatch(/nonce/);
    }
    await env.stop();
  });

  it('refuses when RP expects a nonce but the token omits the claim', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      expectedNonce: 'nonce-required',
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('nonce');
    }
    await env.stop();
  });
});

describe('axis 4 — hash chain (at_hash + c_hash)', () => {
  it('accepts at_hash + c_hash when both match the OIDC §3.1.3.6 recipe', async () => {
    const env = await makeEnv();
    const accessToken = 'access-token-abcdef';
    const code = 'code-xyz-123';
    const idToken = env.signIdToken({
      sub: RP_SUBJECT,
      aud: RP_CLIENT_ID,
      accessToken,
      code,
    });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      expectedAccessToken: accessToken,
      expectedCode: code,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.claims.at_hash).toBe(computeTokenHash(accessToken));
      expect(outcome.claims.c_hash).toBe(computeTokenHash(code));
    }
    await env.stop();
  });

  it('refuses when at_hash mismatches the presented access_token', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({
      sub: RP_SUBJECT,
      aud: RP_CLIENT_ID,
      accessToken: 'access-A',
    });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      expectedAccessToken: 'access-B',
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('hash_chain');
      expect(outcome.issue.reason).toMatch(/at_hash/);
    }
    await env.stop();
  });

  it('refuses when c_hash mismatches the presented authorization code', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({
      sub: RP_SUBJECT,
      aud: RP_CLIENT_ID,
      code: 'code-A',
    });
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
      expectedCode: 'code-B',
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('hash_chain');
      expect(outcome.issue.reason).toMatch(/c_hash/);
    }
    await env.stop();
  });

  it('computeTokenHash matches OIDC §3.1.3.6 recipe (SHA-256[0..15] base64url)', () => {
    // Anchor test — asserts computeTokenHash returns a fixed 22-char
    // base64url string (16 bytes → 22 chars unpadded). Guards against a
    // downstream change to the hash length.
    const hash = computeTokenHash('access-token-abcdef');
    expect(hash).toMatch(/^[A-Za-z0-9_-]{22}$/);
    // Deterministic — same input yields same output every call.
    expect(hash).toBe(computeTokenHash('access-token-abcdef'));
  });
});

describe('mustVerifyIdToken (throwing wrapper)', () => {
  it('returns claims on success', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const claims = mustVerifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(claims.sub).toBe(RP_SUBJECT);
    await env.stop();
  });

  it('throws IdTokenVerifyError with structured issue on failure', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    try {
      mustVerifyIdToken(env.verifyIdToken, idToken.jwt, {
        expectedIssuer: 'https://evil.example.test',
        expectedAudience: RP_CLIENT_ID,
      });
      throw new Error('expected mustVerifyIdToken to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(IdTokenVerifyError);
      const typed = err as IdTokenVerifyError;
      expect(typed.issue.axis).toBe('claims');
    }
    await env.stop();
  });
});

describe('parseIdTokenHeader', () => {
  it('returns alg + kid from the JWT header segment', async () => {
    const env = await makeEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const header = parseIdTokenHeader(idToken.jwt);
    expect(header.alg).toMatch(/^(RS256|ES256)$/);
    expect(header.kid).toBe(idToken.header.kid);
    await env.stop();
  });

  it('throws structural error for a malformed 2-segment token', () => {
    expect(() => parseIdTokenHeader('only.two')).toThrow(IdTokenVerifyError);
  });

  it('throws signature-axis error for a header without kid', () => {
    // Craft a header with no kid — the wrapper flags it as signature-axis
    // because a missing kid disables JWKS lookup.
    const headerB64 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const jwt = `${headerB64}.payload.sig`;
    try {
      parseIdTokenHeader(jwt);
      throw new Error('expected parseIdTokenHeader to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(IdTokenVerifyError);
      const typed = err as IdTokenVerifyError;
      expect(typed.issue.axis).toBe('signature');
      expect(typed.issue.reason).toMatch(/kid/);
    }
  });
});
