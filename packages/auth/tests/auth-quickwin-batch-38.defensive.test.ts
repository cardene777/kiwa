import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  signAuth0IdToken,
  verifyAuth0IdToken,
  verifyAuth0AccessToken,
  generateAuth0SigningSecret,
} from '../src/auth0/jwt.js';
import type { Auth0IdTokenClaims } from '../src/auth0/types.js';

function b64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const SECRET = generateAuth0SigningSecret();
const ISSUER = 'https://tenant.auth0.com/';
const AUDIENCE = 'https://api.example.com/';

const CLAIMS: Auth0IdTokenClaims = {
  iss: ISSUER,
  sub: 'auth0|user-1',
  aud: AUDIENCE,
  iat: 1_900_000_000,
  exp: 1_900_003_600,
} as unknown as Auth0IdTokenClaims;

describe('auth0/jwt verifyJwtSignature internal branches', () => {
  it('throws malformed when token has fewer than 3 segments', () => {
    expect(() =>
      verifyAuth0IdToken('two.parts', SECRET, { issuer: ISSUER, audience: AUDIENCE }),
    ).toThrow(/malformed token/);
  });

  it('throws when JWT header does not match expected HS256/JWT', () => {
    const token = signAuth0IdToken(CLAIMS, SECRET);
    const [, payload, sig] = token.split('.');
    const forgedHeader = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const forged = `${forgedHeader}.${payload}.${sig}`;
    expect(() =>
      verifyAuth0IdToken(forged, SECRET, { issuer: ISSUER, audience: AUDIENCE }),
    ).toThrow(/unexpected JWT header/);
  });

  it('throws signature mismatch when signature is garbage', () => {
    const token = signAuth0IdToken(CLAIMS, SECRET);
    const [header, payload] = token.split('.');
    const forged = `${header}.${payload}.garbage-signature`;
    expect(() =>
      verifyAuth0IdToken(forged, SECRET, { issuer: ISSUER, audience: AUDIENCE }),
    ).toThrow(/signature mismatch/);
  });

  it('throws payload not valid JSON when payload is not JSON', () => {
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const forgedPayload = b64url('not-json-{{{');
    const sig = b64url(
      createHmac('sha256', SECRET).update(`${header}.${forgedPayload}`).digest(),
    );
    const token = `${header}.${forgedPayload}.${sig}`;
    expect(() =>
      verifyAuth0IdToken(token, SECRET, { issuer: ISSUER, audience: AUDIENCE }),
    ).toThrow(/payload is not valid JSON/);
  });

  it('throws token expired when exp is in the past', () => {
    const expiredClaims = {
      ...CLAIMS,
      iat: 1_600_000_000,
      exp: 1_600_003_600, // past
    } as unknown as Auth0IdTokenClaims;
    const token = signAuth0IdToken(expiredClaims, SECRET);
    expect(() =>
      verifyAuth0IdToken(token, SECRET, { issuer: ISSUER, audience: AUDIENCE }),
    ).toThrow(/token expired/);
  });

  it('verifyAuth0AccessToken shares the same verifyJwtSignature helper', () => {
    const token = signAuth0IdToken(CLAIMS, SECRET);
    const [, payload, sig] = token.split('.');
    const forgedHeader = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const forged = `${forgedHeader}.${payload}.${sig}`;
    expect(() =>
      verifyAuth0AccessToken(forged, SECRET, { issuer: ISSUER, audience: AUDIENCE }),
    ).toThrow(/unexpected JWT header/);
  });
});
