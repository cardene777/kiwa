import { createHmac, randomBytes } from 'node:crypto';
import type { ClerkSessionClaims } from './types.js';

/**
 * Clerk uses RS256 signed JWTs in production. The mock uses HS256 with a
 * per-env symmetric secret — the wire shape (`<header>.<payload>.<signature>`)
 * is identical, and consumer code that decodes the token with `Buffer.from(...)
 * .toString('base64url')` sees the same three-part structure. Real signature
 * verification stays external to the mock (that's what `@clerk/backend`'s
 * network call does); the mock's `verifyToken` re-derives the signature from
 * the same secret and rejects tampered tokens.
 */

/** HS256 header, base64url encoded, matches real Clerk token structure. */
const JWT_HEADER = base64UrlEncode(
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf8'),
);

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
}

/**
 * Sign a set of Clerk session claims into a `<header>.<payload>.<signature>`
 * JWT. The secret is unique per test env (generated at setup) — tokens issued
 * by one env cannot be verified by another, which mirrors Clerk's per-instance
 * signing keys.
 */
export function signClerkJwt(claims: ClerkSessionClaims, secret: string): string {
  const payload = base64UrlEncode(Buffer.from(JSON.stringify(claims), 'utf8'));
  const signingInput = `${JWT_HEADER}.${payload}`;
  const signature = base64UrlEncode(
    createHmac('sha256', secret).update(signingInput).digest(),
  );
  return `${signingInput}.${signature}`;
}

/**
 * Verify a JWT and return its decoded claims. Throws on shape mismatch,
 * signature mismatch, or expired token. Mirrors `verifyToken` from
 * `@clerk/backend` — the error messages surface which failure mode hit.
 */
export function verifyClerkJwt(token: string, secret: string): ClerkSessionClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('verifyClerkJwt: malformed token (expected 3 segments)');
  }
  const [header, payload, signature] = parts as [string, string, string];
  if (header !== JWT_HEADER) {
    throw new Error('verifyClerkJwt: unexpected JWT header (expected HS256/JWT)');
  }
  const expected = base64UrlEncode(
    createHmac('sha256', secret).update(`${header}.${payload}`).digest(),
  );
  if (expected !== signature) {
    throw new Error('verifyClerkJwt: signature mismatch');
  }
  let claims: ClerkSessionClaims;
  try {
    claims = JSON.parse(base64UrlDecode(payload).toString('utf8')) as ClerkSessionClaims;
  } catch {
    throw new Error('verifyClerkJwt: payload is not valid JSON');
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= now) {
    throw new Error('verifyClerkJwt: token expired');
  }
  return claims;
}

/**
 * Generate a random secret for signing. Called once per {@link setupClerkEnv}
 * invocation so each env has its own signing key.
 */
export function generateSigningSecret(): string {
  return randomBytes(32).toString('hex');
}
