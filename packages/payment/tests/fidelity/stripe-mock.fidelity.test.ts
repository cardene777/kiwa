/**
 * fidelity test — `docs/concepts/test-taxonomy.md § fidelity` pattern。
 *
 * createStripeMock (kiwa payment mock adapter) が、 想定 reference impl (同 HMAC
 * signing / verify semantics を持つ単純 store) と同じ webhook sign → verify 挙動を
 * 返すことを保証する。 mock ≠ real Stripe 比較の live fidelity は
 * `*.real.fidelity.test.ts` 経路 (現状 scope 外)。
 */
import { createHmac } from 'node:crypto';
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createStripeMock } from '../../src/index.js';

const SECRET = 'whsec_test_secret';
const NOW = 1_700_000_000_000;

/**
 * Reference impl = 同 HMAC(sha256) signing semantics を持つ単純 store。
 * mock 側 (createStripeMock) は signature = hex64 chars を返す (t=<ts>,v1=<> の
 * wrapper なし)。 reference もそれに合わせる。
 */
function referenceStripe() {
  return {
    /** rawBody + timestamp が与えられた前提で HMAC-sha256 hex を返す。 */
    sign(rawBody: string, timestamp: number): string {
      return createHmac('sha256', SECRET).update(`${timestamp}.${rawBody}`).digest('hex');
    },
  };
}

describe('createStripeMock fidelity vs reference HMAC signing store', () => {
  it('signWebhook → verifyWebhook で有効 signature を返す', async () => {
    const mock = createStripeMock({ secret: SECRET, now: () => NOW, toleranceMs: 60_000 });

    const result = await assertFidelity({
      mockFn: async () => {
        const signed = mock.signWebhook({
          type: 'payment.succeeded',
          amountCents: 1000,
          currency: 'usd',
          customerId: 'cus_1',
        });
        const verified = mock.verifyWebhook({
          rawBody: signed.rawBody,
          signature: signed.signature,
        });
        return verified.ok;
      },
      realFn: async () => true,
      cases: [{ name: 'sign→verify → ok=true', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('別 mock instance で verify すると secret が一致しないと ok=false', async () => {
    const mockA = createStripeMock({ secret: SECRET, now: () => NOW, toleranceMs: 60_000 });
    const mockB = createStripeMock({ secret: 'other-secret', now: () => NOW, toleranceMs: 60_000 });

    const signed = mockA.signWebhook({
      type: 'charge.succeeded',
      amountCents: 500,
      currency: 'usd',
      customerId: 'cus_2',
    });

    const result = await assertFidelity({
      mockFn: async () => mockB.verifyWebhook({ rawBody: signed.rawBody, signature: signed.signature }).ok,
      realFn: async () => false,
      cases: [{ name: '別 secret で verify → ok=false', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);
  });

  it('mock signature を reference の HMAC-sha256 で再計算 → 一致 (deterministic sign 経路)', async () => {
    const mock = createStripeMock({ secret: SECRET, now: () => NOW, toleranceMs: 60_000 });
    const real = referenceStripe();

    const signed = mock.signWebhook({
      type: 'payment.succeeded',
      amountCents: 2000,
      currency: 'usd',
      customerId: 'cus_3',
    });

    const result = await assertFidelity({
      mockFn: async () => signed.signature,
      realFn: async () => real.sign(signed.rawBody, NOW),
      cases: [{ name: 'HMAC hex 一致', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });
});
