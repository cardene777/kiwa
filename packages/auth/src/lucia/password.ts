/**
 * Lightweight Argon2 mock used by the Lucia test adapter.
 *
 * The real Lucia stack pairs with `@node-rs/argon2` or `oslo/password`, both of
 * which emit strings shaped like `$argon2id$v=19$m=...$...$hash`. The mock keeps
 * the same envelope so consumers can pattern-match against it, but derives the
 * digest with the built-in Node crypto (`scrypt`) — good enough for tests, fast
 * enough that suites do not stall on kdf cost, and honest about being a mock.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const ARGON2_PREFIX = '$argon2id-mock$v=19$';
const KEY_LEN = 32;
const SALT_LEN = 16;
/**
 * scrypt cost — kept intentionally low. Tests need to hash / verify many times
 * per suite and Lucia adapters routinely run the kdf on every sign-in attempt.
 * Real production values (N >= 2^14) would blow the vitest budget.
 */
const SCRYPT_COST = 1024;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELISATION = 1;

function toB64(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '');
}

function fromB64(str: string): Buffer {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

/**
 * Hash a password. The returned string is opaque to callers and safe to store
 * in the mock user record. Empty passwords are rejected — same policy the real
 * argon2 adapters recommend, and the earliest place we can flag a bug.
 */
export async function hashPassword(password: string): Promise<string> {
  if (password.length === 0) {
    throw new Error('hashPassword: password must not be empty');
  }
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELISATION,
  });
  return `${ARGON2_PREFIX}${toB64(salt)}$${toB64(hash)}`;
}

/**
 * Verify a password against a previously issued hash. Returns false for any
 * malformed hash rather than throwing — matches the real argon2 verifier and
 * lets sign-in flows treat the outcome as a boolean at the call site.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash.startsWith(ARGON2_PREFIX)) return false;
  const parts = hash.slice(ARGON2_PREFIX.length).split('$');
  if (parts.length !== 2) return false;
  const [saltB64, hashB64] = parts;
  if (!saltB64 || !hashB64) return false;
  const salt = fromB64(saltB64);
  const expected = fromB64(hashB64);
  const candidate = scryptSync(password, salt, expected.length, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELISATION,
  });
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
