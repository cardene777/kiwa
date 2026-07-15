import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookProvider } from './client.js';

export interface SignatureVerifyResult {
  valid: boolean;
  provider: WebhookProvider;
  algorithm: string;
  reason?: string;
}

export interface VerifySignatureOptions {
  toleranceSec?: number;
  now?: () => number;
}

/**
 * provider 別 webhook 署名を検証。 実 provider が送る signature format を再現。
 *
 * - stripe = `t=<ts>,v1=<hex>` 形式、 sha256 hex、 toleranceSec 内のみ valid
 * - github = `sha256=<hex>` 形式、 sha256 hex
 * - slack = `v0=<hex>` 形式 (`v0:<ts>:<body>` を base string に)、 sha256 hex
 * - twilio = base64、 sha1 (URL + form params) - mock では payload そのままを署名対象にする
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  provider: WebhookProvider,
  options?: VerifySignatureOptions,
): SignatureVerifyResult {
  const algorithm = provider === 'twilio' ? 'sha1' : 'sha256';
  const encoding: 'hex' | 'base64' = provider === 'twilio' ? 'base64' : 'hex';
  try {
    if (provider === 'stripe') {
      const parts = Object.fromEntries(
        signature.split(',').map((pair) => {
          const [k, ...rest] = pair.split('=');
          return [k ?? '', rest.join('=')];
        }),
      );
      const ts = parts.t;
      const v1 = parts.v1;
      if (!ts || !v1) {
        return { valid: false, provider, algorithm, reason: 'missing t or v1 segment' };
      }
      if (options?.toleranceSec !== undefined) {
        const nowSec = options.now ? Math.floor(options.now() / 1000) : Math.floor(0 / 1000);
        if (Math.abs(nowSec - Number(ts)) > options.toleranceSec) {
          return { valid: false, provider, algorithm, reason: 'timestamp outside tolerance' };
        }
      }
      const base = `${ts}.${payload}`;
      const expected = createHmac(algorithm, secret).update(base).digest(encoding);
      return compareDigests(v1, expected, provider, algorithm, encoding);
    }
    if (provider === 'github') {
      const prefix = 'sha256=';
      if (!signature.startsWith(prefix)) {
        return { valid: false, provider, algorithm, reason: 'missing sha256= prefix' };
      }
      const digest = signature.slice(prefix.length);
      const expected = createHmac(algorithm, secret).update(payload).digest(encoding);
      return compareDigests(digest, expected, provider, algorithm, encoding);
    }
    if (provider === 'slack') {
      const prefix = 'v0=';
      if (!signature.startsWith(prefix)) {
        return { valid: false, provider, algorithm, reason: 'missing v0= prefix' };
      }
      const digest = signature.slice(prefix.length);
      const expected = createHmac(algorithm, secret).update(`v0:${payload}`).digest(encoding);
      return compareDigests(digest, expected, provider, algorithm, encoding);
    }
    const expected = createHmac(algorithm, secret).update(payload).digest(encoding);
    return compareDigests(signature, expected, provider, algorithm, encoding);
  } catch (e) {
    return { valid: false, provider, algorithm, reason: (e as Error).message };
  }
}

function compareDigests(
  actual: string,
  expected: string,
  provider: WebhookProvider,
  algorithm: string,
  encoding: 'hex' | 'base64',
): SignatureVerifyResult {
  try {
    const sigBuf = Buffer.from(actual, encoding);
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
