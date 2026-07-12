import { describe, expect, it } from 'vitest';
import {
  signSupabaseAccessToken,
  verifySupabaseAccessToken,
  generateSupabaseSigningSecret,
} from '../src/supabase/jwt.js';
import type { SupabaseAccessTokenClaims } from '../src/supabase/types.js';

const SECRET = generateSupabaseSigningSecret();
const CLAIMS: SupabaseAccessTokenClaims = {
  iss: 'https://ref.supabase.co/auth/v1',
  sub: 'user-1',
  aud: 'authenticated',
  role: 'authenticated',
  iat: 1_900_000_000,
  exp: 1_900_003_600,
  email: 'a@example.com',
  session_id: 'sess-1',
} as unknown as SupabaseAccessTokenClaims;

describe('supabase/jwt verifySupabaseAccessToken defensive branches', () => {
  it('throws when token does not have 3 segments', () => {
    expect(() => verifySupabaseAccessToken('two.parts', SECRET)).toThrow(/malformed token/);
    expect(() => verifySupabaseAccessToken('a.b.c.d', SECRET)).toThrow(/malformed token/);
  });

  it('throws when JWT header is not HS256/JWT', () => {
    const valid = signSupabaseAccessToken(CLAIMS, SECRET);
    const [_h, payload, sig] = valid.split('.');
    const forgedHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' }))
      .toString('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    expect(() => verifySupabaseAccessToken(`${forgedHeader}.${payload}.${sig}`, SECRET)).toThrow(
      /unexpected JWT header/,
    );
  });

  it('throws when signature does not match', () => {
    const valid = signSupabaseAccessToken(CLAIMS, SECRET);
    const [h, payload, _sig] = valid.split('.');
    const forgedSig = 'garbage-signature';
    expect(() => verifySupabaseAccessToken(`${h}.${payload}.${forgedSig}`, SECRET)).toThrow(
      /signature mismatch/,
    );
  });

  it('throws when payload is not valid JSON', () => {
    const forgedPayload = Buffer.from('not-json-{{{')
      .toString('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    // sign the forged payload with correct header + real HMAC so signature check passes
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .toString('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const { createHmac } = require('node:crypto');
    const sig = createHmac('sha256', SECRET)
      .update(`${header}.${forgedPayload}`)
      .digest('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    expect(() =>
      verifySupabaseAccessToken(`${header}.${forgedPayload}.${sig}`, SECRET),
    ).toThrow(/payload is not valid JSON/);
  });

  it('throws when token is expired', () => {
    const expiredClaims: SupabaseAccessTokenClaims = {
      ...CLAIMS,
      iat: 1_600_000_000,
      exp: 1_600_003_600, // year 2020 = expired
    } as unknown as SupabaseAccessTokenClaims;
    const token = signSupabaseAccessToken(expiredClaims, SECRET);
    expect(() => verifySupabaseAccessToken(token, SECRET)).toThrow(/token expired/);
  });

  it('happy path returns claims when valid', () => {
    const token = signSupabaseAccessToken(CLAIMS, SECRET);
    const decoded = verifySupabaseAccessToken(token, SECRET);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.aud).toBe('authenticated');
  });
});
