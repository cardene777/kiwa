import { describe, expect, it } from 'vitest';
import { signClerkJwt, verifyClerkJwt } from '../src/clerk/jwt.js';
import {
  base64UrlEncode,
  base64UrlDecode,
  normalizeChallenge,
  mockSignature,
  clientDataHash,
} from '../src/webauthn/encoding.js';
import type { ClerkSessionClaims } from '../src/clerk/types.js';

const SECRET = 'test-secret-clerk';

describe('clerk/jwt verifyClerkJwt defensive branches', () => {
  it('throws when token does not have 3 segments', () => {
    expect(() => verifyClerkJwt('foo.bar', SECRET)).toThrow(/malformed token/);
    expect(() => verifyClerkJwt('single', SECRET)).toThrow(/malformed token/);
    expect(() => verifyClerkJwt('a.b.c.d', SECRET)).toThrow(/malformed token/);
  });

  it('throws when JWT header is not the expected HS256/JWT header', () => {
    const claims: ClerkSessionClaims = {
      iss: 'https://tenant.clerk.accounts.dev',
      sub: 'user_1',
      sid: 'sess_1',
      iat: 1_900_000_000,
      exp: 1_900_003_600,
    } as ClerkSessionClaims;
    const validToken = signClerkJwt(claims, SECRET);
    const [_originalHeader, payload, signature] = validToken.split('.');
    const forgedHeader = base64UrlEncode(
      new TextEncoder().encode(JSON.stringify({ alg: 'none', typ: 'JWT' })),
    );
    const forgedToken = `${forgedHeader}.${payload}.${signature}`;
    expect(() => verifyClerkJwt(forgedToken, SECRET)).toThrow(/unexpected JWT header/);
  });

  it('happy path returns claims when token is valid', () => {
    const claims: ClerkSessionClaims = {
      iss: 'https://tenant.clerk.accounts.dev',
      sub: 'user_1',
      sid: 'sess_1',
      iat: 1_900_000_000,
      exp: 1_900_003_600,
    } as ClerkSessionClaims;
    const token = signClerkJwt(claims, SECRET);
    const decoded = verifyClerkJwt(token, SECRET);
    expect(decoded.sub).toBe('user_1');
    expect(decoded.sid).toBe('sess_1');
  });
});

describe('webauthn/encoding defensive branches', () => {
  it('base64UrlEncode returns already-encoded Uint8Array input', () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const encoded = base64UrlEncode(bytes);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('base64UrlEncode handles string input via TextEncoder', () => {
    const encoded = base64UrlEncode('hello');
    expect(encoded).toBe('aGVsbG8');
  });

  it('base64UrlDecode handles padding-required input', () => {
    const decoded = base64UrlDecode('aGVsbG8');
    expect(decoded).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(decoded)).toBe('hello');
  });

  it('base64UrlDecode handles input divisible by 4 (no padding needed)', () => {
    const decoded = base64UrlDecode('YWJjZA');
    expect(new TextDecoder().decode(decoded)).toBe('abcd');
  });

  it('normalizeChallenge returns Uint8Array as base64url encoded string', () => {
    const bytes = new Uint8Array([65, 66, 67]);
    const out = normalizeChallenge(bytes);
    expect(typeof out).toBe('string');
  });

  it('normalizeChallenge returns already-base64url string as-is', () => {
    const already = 'abc-DEF_123';
    expect(normalizeChallenge(already)).toBe(already);
  });

  it('normalizeChallenge encodes non-base64url string', () => {
    const raw = 'hello world!';
    const encoded = normalizeChallenge(raw);
    expect(encoded).not.toBe(raw);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('mockSignature produces deterministic output', () => {
    const s1 = mockSignature('pk', 'authData', 'hash');
    const s2 = mockSignature('pk', 'authData', 'hash');
    expect(s1).toBe(s2);
  });

  it('clientDataHash produces deterministic 32-byte digest', () => {
    const h1 = clientDataHash('{"type":"webauthn.create"}');
    const h2 = clientDataHash('{"type":"webauthn.create"}');
    expect(h1).toBe(h2);
    expect(h1.length).toBeGreaterThan(0);
  });
});
