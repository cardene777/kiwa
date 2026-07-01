/**
 * Deterministic TOTP mock for the Better Auth `twoFactor` plugin.
 *
 * Real Better Auth 2FA delegates to `otpauth` (RFC 6238) with a shared base32
 * secret. The mock keeps the same call shape (`generateTotpCode(secret) -> string`,
 * 6-digit numeric code) but derives the digit sequence from an HMAC-SHA1 of the
 * secret + the current 30-second time step. Tests that verify against
 * {@link verifyTotpCode} can freely inject a fixed clock via the optional
 * `nowMs` parameter so the suite is not wall-clock dependent.
 */
import { createHmac, randomBytes } from 'node:crypto';

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

export function generateTotpSecret(): string {
  // Real TOTP secrets are base32 — the mock uses hex for shape simplicity, still
  // opaque to callers who only round-trip it back into generateTotpCode.
  return randomBytes(20).toString('hex');
}

export function generateTotpCode(secret: string, nowMs: number = Date.now()): string {
  const counter = Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', Buffer.from(secret, 'hex')).update(counterBuf).digest();
  // Dynamic truncation (RFC 4226 §5.3).
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const offset = hmac[hmac.length - 1]! & 0xf;
  const bin =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  const code = bin % 10 ** TOTP_DIGITS;
  return code.toString().padStart(TOTP_DIGITS, '0');
}

export function verifyTotpCode(
  secret: string,
  code: string,
  nowMs: number = Date.now(),
): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  // Accept the current step and the immediately previous one — matches how the
  // real TOTP verifier tolerates a 30-second clock drift.
  const current = generateTotpCode(secret, nowMs);
  if (current === code) return true;
  const previous = generateTotpCode(secret, nowMs - TOTP_STEP_SECONDS * 1000);
  return previous === code;
}
