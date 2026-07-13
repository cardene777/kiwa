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

  it('rawBody 改竄 = verify 失敗 (bad-signature reason、 セキュリティ契約)', async () => {
    const mock = createStripeMock({ secret: SECRET, now: () => NOW, toleranceMs: 60_000 });
    const signed = mock.signWebhook({
      type: 'payment.succeeded',
      amountCents: 1000,
      currency: 'usd',
      customerId: 'cus_tamper',
    });
    const tamperedBody = signed.rawBody.replace('cus_tamper', 'cus_hacked');

    const result = mock.verifyWebhook({
      rawBody: tamperedBody,
      signature: signed.signature,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('bad-signature');
  });

  it('古い timestamp = stale-timestamp reason で reject (tolerance 越え)', async () => {
    const mock = createStripeMock({
      secret: SECRET,
      now: () => NOW,
      toleranceMs: 60_000, // 1 分
    });
    const OLD = NOW - 5 * 60 * 1000; // 5 分前 = tolerance 越え
    const signed = mock.signWebhook({
      type: 'payment.succeeded',
      amountCents: 1000,
      currency: 'usd',
      customerId: 'cus_old',
      timestamp: OLD,
    });

    const result = mock.verifyWebhook({
      rawBody: signed.rawBody,
      signature: signed.signature,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('stale-timestamp');
  });

  it('malformed rawBody (JSON parse fail) = malformed-body reason', async () => {
    const mock = createStripeMock({ secret: SECRET, now: () => NOW });

    const result = mock.verifyWebhook({
      rawBody: 'not-json-{',
      signature: 'any-sig',
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('malformed-body');
  });

  it('複数 signWebhook = 連続 event id が生成される (両実装 counter increment)', async () => {
    const mock = createStripeMock({ secret: SECRET, now: () => NOW });

    const s1 = mock.signWebhook({
      type: 'payment.succeeded',
      amountCents: 100,
      currency: 'usd',
      customerId: 'cus_a',
    });
    const s2 = mock.signWebhook({
      type: 'payment.succeeded',
      amountCents: 200,
      currency: 'usd',
      customerId: 'cus_b',
    });
    // 両 event の id が異なる
    expect(s1.event.id).not.toBe(s2.event.id);
    expect(s1.event.id.startsWith('evt_')).toBe(true);
    expect(s2.event.id.startsWith('evt_')).toBe(true);
  });

  it('event body に amountCents / currency / customerId が保存される', async () => {
    const mock = createStripeMock({ secret: SECRET, now: () => NOW });

    const s = mock.signWebhook({
      type: 'charge.succeeded',
      amountCents: 3500,
      currency: 'jpy',
      customerId: 'cus_jp',
    });
    // rawBody parse で field 保持確認
    const parsed = JSON.parse(s.rawBody);
    expect(parsed.amountCents).toBe(3500);
    expect(parsed.currency).toBe('jpy');
    expect(parsed.customerId).toBe('cus_jp');
    expect(parsed.type).toBe('charge.succeeded');
  });
});
