import { createHash, randomBytes } from 'node:crypto';
import type { PkceChallenge, PkceChallengeMethod } from './types.js';

/**
 * Module-scoped monotonic counter so `generateCodeVerifier` produces
 * reproducible verifiers within a test. Real deployments feed a
 * cryptographically random verifier; the mock keeps a deterministic prefix
 * plus fresh entropy so the same test wired twice sees the same value.
 * Callers wanting non-deterministic verifiers can shim `Math.random` — the
 * mock intentionally keeps the counter cheap and predictable.
 */
let verifierCounter = 0;

/**
 * Reset the verifier counter. Called by `setupOAuth21Env` when preparing a
 * fresh env so repeated env constructions produce identical output.
 */
export function __resetPkceCounter(): void {
  verifierCounter = 0;
}

/**
 * Base64url-encode a `Buffer`. RFC 7636 §4.1 requires base64url without
 * padding.
 */
function base64Url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a fresh code verifier. RFC 7636 §4.1 requires 43-128 characters
 * from the unreserved URL set. The mock produces 43-char base64url strings.
 */
export function generateCodeVerifier(): string {
  verifierCounter += 1;
  // 32 bytes of randomness → 43 base64url chars (matches the low-end RFC 7636
  // §4.1 requirement of 43-128 characters). We start with a deterministic
  // prefix for grep-friendly test output, pad with random bytes to 32 bytes
  // total, then base64url encode — the encoded string ends up 43 chars.
  const prefix = Buffer.from(
    `v${verifierCounter.toString().padStart(3, '0')}`,
  );
  const remaining = 32 - prefix.length;
  const entropy = randomBytes(remaining);
  const combined = Buffer.concat([prefix, entropy]);
  return base64Url(combined);
}

/**
 * Derive the code challenge for a verifier. RFC 9700 §2.1.1 forbids the
 * `plain` method — the function rejects it explicitly rather than silently
 * downgrading. Only `S256` is accepted.
 */
export function deriveCodeChallenge(
  verifier: string,
  method: PkceChallengeMethod = 'S256',
): string {
  if ((method as string) === 'plain') {
    throw new Error(
      'deriveCodeChallenge: PKCE method "plain" is forbidden by RFC 9700 — use S256',
    );
  }
  if (method !== 'S256') {
    throw new Error(
      `deriveCodeChallenge: unknown PKCE method "${method}" — expected S256`,
    );
  }
  if (typeof verifier !== 'string' || verifier.length < 43 || verifier.length > 128) {
    throw new Error(
      `deriveCodeChallenge: code verifier must be 43-128 chars (got ${verifier.length})`,
    );
  }
  const hash = createHash('sha256').update(verifier).digest();
  return base64Url(hash);
}

/**
 * Build a complete PKCE challenge (verifier + challenge). Convenience wrapper
 * that always uses S256.
 */
export function createPkceChallenge(): PkceChallenge {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = deriveCodeChallenge(codeVerifier, 'S256');
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Verify that a supplied `codeVerifier` hashes to the stored `codeChallenge`.
 * Used by the token endpoint on `authorization_code` exchange.
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: PkceChallengeMethod,
): boolean {
  const derived = deriveCodeChallenge(codeVerifier, method);
  return derived === codeChallenge;
}
