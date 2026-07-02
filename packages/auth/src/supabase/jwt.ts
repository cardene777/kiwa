import { createHmac, randomBytes } from 'node:crypto';
import type { SupabaseAccessTokenClaims } from './types.js';

/**
 * Supabase Auth (GoTrue) uses HS256 JWTs by default — the JWT_SECRET on the
 * server signs both access_token and refresh_token. This mock mirrors the same
 * scheme so consumers who verify tokens with the JWT_SECRET see the same
 * `<header>.<payload>.<signature>` shape.
 */

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
 * Sign a set of Supabase access-token claims into a `<header>.<payload>.<signature>`
 * JWT. The secret is unique per test env — tokens issued by one env cannot be
 * verified by another, mirroring per-project JWT_SECRET separation in production.
 */
export function signSupabaseAccessToken(
  claims: SupabaseAccessTokenClaims,
  secret: string,
): string {
  const payload = base64UrlEncode(Buffer.from(JSON.stringify(claims), 'utf8'));
  const signingInput = `${JWT_HEADER}.${payload}`;
  const signature = base64UrlEncode(
    createHmac('sha256', secret).update(signingInput).digest(),
  );
  return `${signingInput}.${signature}`;
}

/**
 * Verify a Supabase access token JWT and return its decoded claims. Throws on
 * shape mismatch, signature mismatch, or expired token. Mirrors GoTrue's own
 * verification path.
 */
export function verifySupabaseAccessToken(
  token: string,
  secret: string,
): SupabaseAccessTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('verifySupabaseAccessToken: malformed token (expected 3 segments)');
  }
  const [header, payload, signature] = parts as [string, string, string];
  if (header !== JWT_HEADER) {
    throw new Error(
      'verifySupabaseAccessToken: unexpected JWT header (expected HS256/JWT)',
    );
  }
  const expected = base64UrlEncode(
    createHmac('sha256', secret).update(`${header}.${payload}`).digest(),
  );
  if (expected !== signature) {
    throw new Error('verifySupabaseAccessToken: signature mismatch');
  }
  let claims: SupabaseAccessTokenClaims;
  try {
    claims = JSON.parse(base64UrlDecode(payload).toString('utf8')) as SupabaseAccessTokenClaims;
  } catch {
    throw new Error('verifySupabaseAccessToken: payload is not valid JSON');
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= now) {
    throw new Error('verifySupabaseAccessToken: token expired');
  }
  return claims;
}

/**
 * Generate a random 32-byte secret for signing. Called once per
 * {@link setupSupabaseAuthEnv} invocation so each env has its own signing key.
 */
export function generateSupabaseSigningSecret(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a random opaque refresh token. Supabase's real refresh tokens are
 * opaque strings (not JWTs) rotated on each `refreshSession` call.
 */
export function generateSupabaseRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Generate a 6-digit OTP code — Supabase uses these for both email + SMS OTP
 * flows.
 */
export function generateOtpCode(): string {
  // Uniform 0..999999, encoded as 6 digits with left padding.
  const buf = randomBytes(3);
  const num = ((buf[0]! << 16) | (buf[1]! << 8) | buf[2]!) % 1_000_000;
  return num.toString().padStart(6, '0');
}
