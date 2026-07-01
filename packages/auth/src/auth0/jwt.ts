import { createHmac, randomBytes } from 'node:crypto';
import type { Auth0AccessTokenClaims, Auth0IdTokenClaims } from './types.js';

/**
 * Auth0 signs id_token + access_token with RS256 in production (JWKS-based
 * verification against `https://<tenant>.auth0.com/.well-known/jwks.json`).
 * The mock uses HS256 with a per-env symmetric secret — the on-the-wire
 * `<header>.<payload>.<signature>` shape is identical, and every consumer
 * that decodes the token with `Buffer.from(...).toString('base64url')`
 * sees the same three-part structure. Real signature verification stays
 * external to the mock (that's what `express-jwt` / `jose` does over the
 * network); the mock's `verifyIdToken` + `verifyAccessToken` re-derive the
 * HMAC from the same secret and reject tampered tokens.
 */

/** HS256 header, base64url encoded — mirrors real Auth0 token structure. */
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
 * Sign a set of Auth0 id_token claims into a `<header>.<payload>.<signature>`
 * JWT. The secret is unique per test env — tokens issued by one env cannot be
 * verified by another, which mirrors Auth0's per-tenant signing keys.
 */
export function signAuth0IdToken(claims: Auth0IdTokenClaims, secret: string): string {
  return signJwt(claims, secret);
}

/**
 * Sign a set of Auth0 access_token claims. Same signature shape as id_token
 * — Auth0's real access tokens are separately signed with the tenant's key
 * pair, but for the mock they share the per-env secret to keep the verify
 * path uniform.
 */
export function signAuth0AccessToken(claims: Auth0AccessTokenClaims, secret: string): string {
  return signJwt(claims, secret);
}

function signJwt(claims: object, secret: string): string {
  const payload = base64UrlEncode(Buffer.from(JSON.stringify(claims), 'utf8'));
  const signingInput = `${JWT_HEADER}.${payload}`;
  const signature = base64UrlEncode(
    createHmac('sha256', secret).update(signingInput).digest(),
  );
  return `${signingInput}.${signature}`;
}

/**
 * Verify an id_token and return its decoded claims. Throws on shape mismatch,
 * signature mismatch, expired token, or issuer mismatch. Mirrors what
 * `express-jwt` + JWKS verification does in a real Auth0 backend.
 */
export function verifyAuth0IdToken(
  token: string,
  secret: string,
  expected: { issuer: string; audience: string },
): Auth0IdTokenClaims {
  const claims = verifyJwtSignature<Auth0IdTokenClaims>(token, secret);
  if (claims.iss !== expected.issuer) {
    throw new Error(
      `verifyAuth0IdToken: issuer mismatch (expected ${expected.issuer}, got ${claims.iss})`,
    );
  }
  if (claims.aud !== expected.audience) {
    throw new Error(
      `verifyAuth0IdToken: audience mismatch (expected ${expected.audience}, got ${String(claims.aud)})`,
    );
  }
  return claims;
}

/**
 * Verify an access_token. Auth0's access tokens can have `aud` as string or
 * string[] — the mock accepts both and matches the expected audience against
 * every entry.
 */
export function verifyAuth0AccessToken(
  token: string,
  secret: string,
  expected: { issuer: string; audience: string },
): Auth0AccessTokenClaims {
  const claims = verifyJwtSignature<Auth0AccessTokenClaims>(token, secret);
  if (claims.iss !== expected.issuer) {
    throw new Error(
      `verifyAuth0AccessToken: issuer mismatch (expected ${expected.issuer}, got ${claims.iss})`,
    );
  }
  const audienceMatches = Array.isArray(claims.aud)
    ? claims.aud.includes(expected.audience)
    : claims.aud === expected.audience;
  if (!audienceMatches) {
    throw new Error(
      `verifyAuth0AccessToken: audience mismatch (expected ${expected.audience}, got ${JSON.stringify(claims.aud)})`,
    );
  }
  return claims;
}

function verifyJwtSignature<T>(token: string, secret: string): T {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('verifyAuth0Jwt: malformed token (expected 3 segments)');
  }
  const [header, payload, signature] = parts as [string, string, string];
  if (header !== JWT_HEADER) {
    throw new Error('verifyAuth0Jwt: unexpected JWT header (expected HS256/JWT)');
  }
  const expected = base64UrlEncode(
    createHmac('sha256', secret).update(`${header}.${payload}`).digest(),
  );
  if (expected !== signature) {
    throw new Error('verifyAuth0Jwt: signature mismatch');
  }
  let claims: T & { exp?: number };
  try {
    claims = JSON.parse(base64UrlDecode(payload).toString('utf8')) as T & { exp?: number };
  } catch {
    throw new Error('verifyAuth0Jwt: payload is not valid JSON');
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= now) {
    throw new Error('verifyAuth0Jwt: token expired');
  }
  return claims;
}

/**
 * Generate a random signing secret. Called once per {@link setupAuth0Env}
 * invocation so each env has its own signing key — mirrors Auth0's per-tenant
 * key isolation.
 */
export function generateAuth0SigningSecret(): string {
  return randomBytes(32).toString('hex');
}
