import { createHmac, randomBytes } from 'node:crypto';

/**
 * TOTP (RFC 6238) implementation. Supabase's MFA layer uses TOTP with the
 * standard 30-second step + 6-digit output + SHA-1 HMAC — matched here so
 * consumers can drive real TOTP client libraries against the mock.
 */

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(byteLength = 20): string {
  const buf = randomBytes(byteLength);
  return base32Encode(buf);
}

/**
 * Generate the TOTP code for the given moment. `nowSeconds` is exposed so
 * tests can advance time deterministically.
 */
export function generateTotpCode(secretBase32: string, nowSeconds: number = Math.floor(Date.now() / 1000)): string {
  const counter = Math.floor(nowSeconds / TOTP_STEP_SECONDS);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(Math.floor(counter / 0x1_0000_0000), 0);
  counterBuf.writeUInt32BE(counter % 0x1_0000_0000, 4);
  const secretBuf = base32Decode(secretBase32);
  const hmac = createHmac('sha1', secretBuf).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  const code = (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
  return code;
}

export function verifyTotpCode(
  secretBase32: string,
  code: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  windowSteps = 1,
): boolean {
  for (let i = -windowSteps; i <= windowSteps; i++) {
    const step = nowSeconds + i * TOTP_STEP_SECONDS;
    if (generateTotpCode(secretBase32, step) === code) return true;
  }
  return false;
}

/**
 * Build the standard `otpauth://` URI clients scan into an authenticator app.
 */
export function buildOtpAuthUri(input: {
  secret: string;
  accountName: string;
  issuer: string;
}): string {
  const label = `${encodeURIComponent(input.issuer)}:${encodeURIComponent(input.accountName)}`;
  const params = new URLSearchParams({
    secret: input.secret,
    issuer: input.issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Generate a set of one-time backup codes. Each code is 10 hex characters,
 * matching a common Supabase-adjacent pattern.
 */
export function generateBackupCodes(count = 10): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(randomBytes(5).toString('hex'));
  }
  return out;
}

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(encoded: string): Buffer {
  const clean = encoded.replace(/=+$/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) {
      throw new Error(`base32Decode: invalid character ${ch}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
