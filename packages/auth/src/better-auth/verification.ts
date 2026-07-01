import { randomBytes } from 'node:crypto';

/**
 * Better Auth's magic-link plugin issues a url-safe token (default 32 bytes hex).
 * The mock keeps the same envelope so callers can pattern-match against it.
 */
const TOKEN_BYTES = 32;

export function generateVerificationToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}
