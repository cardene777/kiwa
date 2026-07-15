import { createHmac, timingSafeEqual } from 'node:crypto';
import type { EmailProvider } from './client.js';

export interface SignatureVerifyResult {
  valid: boolean;
  provider: EmailProvider;
  algorithm: string;
  reason?: string;
}

/**
 * provider 別 webhook 署名を検証。 real provider (Resend / SendGrid / Postmark / SES) が
 * 実際に送る signature format (sha256 hex / base64) を再現。
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  provider: EmailProvider,
): SignatureVerifyResult {
  const algorithm = provider === 'ses' ? 'sha1' : 'sha256';
  const encoding: 'hex' | 'base64' = provider === 'sendgrid' ? 'base64' : 'hex';
  const expected = createHmac(algorithm, secret).update(payload).digest(encoding);
  try {
    const sigBuf = Buffer.from(signature, encoding);
    const expBuf = Buffer.from(expected, encoding);
    if (sigBuf.length !== expBuf.length) {
      return { valid: false, provider, algorithm, reason: 'length mismatch' };
    }
    const valid = timingSafeEqual(sigBuf, expBuf);
    const result: SignatureVerifyResult = { valid, provider, algorithm };
    if (!valid) result.reason = 'digest mismatch';
    return result;
  } catch (e) {
    return { valid: false, provider, algorithm, reason: (e as Error).message };
  }
}
