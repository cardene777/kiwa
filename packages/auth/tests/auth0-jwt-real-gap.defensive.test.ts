import { describe, expect, it } from 'vitest';
import {
  signAuth0IdToken,
  signAuth0AccessToken,
  verifyAuth0IdToken,
  verifyAuth0AccessToken,
  generateAuth0SigningSecret,
} from '../src/auth0/jwt.js';
import type { Auth0AccessTokenClaims, Auth0IdTokenClaims } from '../src/auth0/types.js';

const SECRET = generateAuth0SigningSecret();
const ISSUER = 'https://tenant.auth0.com/';
const AUDIENCE = 'https://api.example.com/';

const ID_CLAIMS: Auth0IdTokenClaims = {
  iss: ISSUER,
  sub: 'auth0|user-1',
  aud: AUDIENCE,
  iat: 1900000000,
  exp: 1900003600,
  nonce: 'nonce-1',
  email: 'user@example.com',
  email_verified: true,
} as Auth0IdTokenClaims;

const ACCESS_CLAIMS: Auth0AccessTokenClaims = {
  iss: ISSUER,
  sub: 'auth0|user-1',
  aud: AUDIENCE,
  iat: 1900000000,
  exp: 1900003600,
  scope: 'openid profile email',
} as Auth0AccessTokenClaims;

describe('auth0/jwt verifyAuth0IdToken defensive branches', () => {
  it('happy path returns claims when issuer + audience match', () => {
    const token = signAuth0IdToken(ID_CLAIMS, SECRET);
    const claims = verifyAuth0IdToken(token, SECRET, { issuer: ISSUER, audience: AUDIENCE });
    expect(claims.iss).toBe(ISSUER);
    expect(claims.aud).toBe(AUDIENCE);
  });

  it('throws when issuer mismatches', () => {
    const token = signAuth0IdToken(ID_CLAIMS, SECRET);
    expect(() =>
      verifyAuth0IdToken(token, SECRET, { issuer: 'https://other.auth0.com/', audience: AUDIENCE }),
    ).toThrow(/issuer mismatch/);
  });

  it('throws when audience mismatches', () => {
    const token = signAuth0IdToken(ID_CLAIMS, SECRET);
    expect(() =>
      verifyAuth0IdToken(token, SECRET, { issuer: ISSUER, audience: 'https://other.com/' }),
    ).toThrow(/audience mismatch/);
  });
});

describe('auth0/jwt verifyAuth0AccessToken defensive branches', () => {
  it('happy path returns claims when issuer + audience (string) match', () => {
    const token = signAuth0AccessToken(ACCESS_CLAIMS, SECRET);
    const claims = verifyAuth0AccessToken(token, SECRET, { issuer: ISSUER, audience: AUDIENCE });
    expect(claims.iss).toBe(ISSUER);
    expect(claims.aud).toBe(AUDIENCE);
  });

  it('happy path returns claims when audience is array containing expected', () => {
    const claims: Auth0AccessTokenClaims = {
      ...ACCESS_CLAIMS,
      aud: [AUDIENCE, 'https://other.com/'],
    } as unknown as Auth0AccessTokenClaims;
    const token = signAuth0AccessToken(claims, SECRET);
    const verified = verifyAuth0AccessToken(token, SECRET, { issuer: ISSUER, audience: AUDIENCE });
    expect(Array.isArray(verified.aud)).toBe(true);
  });

  it('throws when issuer mismatches', () => {
    const token = signAuth0AccessToken(ACCESS_CLAIMS, SECRET);
    expect(() =>
      verifyAuth0AccessToken(token, SECRET, { issuer: 'https://other.auth0.com/', audience: AUDIENCE }),
    ).toThrow(/issuer mismatch/);
  });

  it('throws when audience (string) mismatches', () => {
    const token = signAuth0AccessToken(ACCESS_CLAIMS, SECRET);
    expect(() =>
      verifyAuth0AccessToken(token, SECRET, { issuer: ISSUER, audience: 'https://other.com/' }),
    ).toThrow(/audience mismatch/);
  });

  it('throws when audience (array) does not include expected', () => {
    const claims: Auth0AccessTokenClaims = {
      ...ACCESS_CLAIMS,
      aud: ['https://other-1.com/', 'https://other-2.com/'],
    } as unknown as Auth0AccessTokenClaims;
    const token = signAuth0AccessToken(claims, SECRET);
    expect(() =>
      verifyAuth0AccessToken(token, SECRET, { issuer: ISSUER, audience: AUDIENCE }),
    ).toThrow(/audience mismatch/);
  });
});
