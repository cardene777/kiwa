/**
 * Password helper for the Better Auth test adapter.
 *
 * Better Auth's real implementation uses scrypt via `@better-auth/utils` (or delegates
 * to a caller-provided `password.hash` config). The mock keeps the same shape — an
 * opaque digest string with a `$scrypt-mock$` envelope — while running scrypt at a
 * deliberately low cost so vitest suites do not stall.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_PREFIX = '$scrypt-mock$v=1$';
const KEY_LEN = 32;
const SALT_LEN = 16;
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
  return `${SCRYPT_PREFIX}${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  if (!hash.startsWith(SCRYPT_PREFIX)) return false;
  const parts = hash.slice(SCRYPT_PREFIX.length).split('$');
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
