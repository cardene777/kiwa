/**
 * fidelity test — createWebhookVerifier (kiwa mock) が reference impl と同じ挙動を
 * 示すことを検証。 5 case で verify / delivered list / provider 差異 / rejected path /
 * clear の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { createWebhookVerifier, verifyWebhookSignature } from '../../src/index.js';

function referenceInbox() {
  const store: Array<{ id: string; status: 'verified' | 'rejected' }> = [];
  let counter = 0;
  return {
    verify(valid: boolean) {
      counter += 1;
      const record = { id: `ref-${counter}`, status: valid ? ('verified' as const) : ('rejected' as const) };
      store.push(record);
      return record;
    },
    list() {
      return [...store];
    },
  };
}

describe('webhook verifier fidelity vs reference impl', () => {
  it('valid signature = verified、 invalid = rejected の 2 case で reference と一致', async () => {
    const secret = 's';
    const mock = createWebhookVerifier({ provider: 'github', secret });
    const real = referenceInbox();
    const jsonBody = JSON.stringify({ event: 'push', delivery: 'gh_1', timestamp: 1 });
    const validSig = `sha256=${createHmac('sha256', secret).update(jsonBody).digest('hex')}`;

    const result = await assertFidelity({
      mockFn: async (raw: string) => {
        const sig = raw === 'good' ? validSig : 'sha256=deadbeef';
        return mock.verify({ payload: jsonBody, signature: sig }).status;
      },
      realFn: async (raw: string) => {
        const ok = verifyWebhookSignature(jsonBody, raw === 'good' ? validSig : 'sha256=deadbeef', secret, 'github').valid;
        return real.verify(ok).status;
      },
      cases: [
        { name: 'valid signature', args: ['good'] },
        { name: 'invalid signature', args: ['bad'] },
      ],
    });
    expect(result.ratio).toBe(100);
  });

  it('複数 verify で listDelivered が全 record を保持', () => {
    const secret = 's';
    const mock = createWebhookVerifier({ provider: 'stripe', secret });
    const payload = JSON.stringify({ type: 'payment_intent.succeeded', id: 'evt_1', created: 1, data: { object: { id: 'pi_1' } } });
    const v1 = createHmac('sha256', secret).update(`0.${payload}`).digest('hex');
    for (let i = 0; i < 3; i++) {
      mock.verify({ payload, signature: `t=0,v1=${v1}` });
    }
    expect(mock.listDelivered().length).toBe(3);
    expect(mock.listDelivered()[0]!.status).toBe('verified');
  });

  it('provider 別 verifier で id prefix が異なる', () => {
    const secret = 's';
    const stripe = createWebhookVerifier({ provider: 'stripe', secret });
    const github = createWebhookVerifier({ provider: 'github', secret });
    const out1 = stripe.verify({ payload: 'x', signature: 'bad' });
    const out2 = github.verify({ payload: 'x', signature: 'bad' });
    expect(out1.id.startsWith('evt-')).toBe(true);
    expect(out2.id.startsWith('gh-')).toBe(true);
  });

  it('invalid signature → rejected outcome + reason 付与', () => {
    const secret = 's';
    const mock = createWebhookVerifier({ provider: 'slack', secret });
    const outcome = mock.verify({ payload: 'x', signature: 'v0=deadbeef' });
    expect(outcome.status).toBe('rejected');
    expect(outcome.reason).toBeDefined();
  });

  it('clear で listDelivered が空になる', () => {
    const secret = 's';
    const mock = createWebhookVerifier({ provider: 'twilio', secret });
    mock.verify({ payload: 'x', signature: 'bad' });
    expect(mock.listDelivered().length).toBe(1);
    mock.clear();
    expect(mock.listDelivered().length).toBe(0);
  });

  it('edge: 空 payload でも verify 実行 (reject 返る想定)', () => {
    const mock = createWebhookVerifier({ provider: 'github', secret: 's' });
    const out = mock.verify({ payload: '', signature: 'bad' });
    expect(out.status).toBe('rejected');
  });

  it('edge: 大量 verify (50 件) で counter が正しく増加', () => {
    const mock = createWebhookVerifier({ provider: 'github', secret: 's' });
    for (let i = 0; i < 50; i++) mock.verify({ payload: `p${i}`, signature: 'bad' });
    expect(mock.listDelivered().length).toBe(50);
    expect(mock.listDelivered()[49]!.id).toContain('gh-50');
  });

  it('edge: concurrent verify で全 id 一意', () => {
    const mock = createWebhookVerifier({ provider: 'github', secret: 's' });
    const outs = Array.from({ length: 10 }, (_, i) => mock.verify({ payload: `p${i}`, signature: 'bad' }));
    expect(new Set(outs.map((o) => o.id)).size).toBe(10);
  });

  it('edge: large payload (10KB) を verify に投入 (mock 判定 status 有効)', () => {
    const mock = createWebhookVerifier({ provider: 'github', secret: 'k' });
    const payload = 'x'.repeat(10240);
    const out = mock.verify({ payload, signature: 'bad' });
    expect(['verified', 'rejected']).toContain(out.status);
    expect(out.id).toBeDefined();
  });

  it('edge: provider 別 idPrefix (evt/gh/sl/tw) 全 4 種確認', () => {
    for (const [provider, prefix] of Object.entries({ stripe: 'evt', github: 'gh', slack: 'sl', twilio: 'tw' })) {
      const m = createWebhookVerifier({ provider: provider as 'stripe' | 'github' | 'slack' | 'twilio', secret: 's' });
      const out = m.verify({ payload: 'p', signature: 'bad' });
      expect(out.id.startsWith(prefix + '-')).toBe(true);
    }
  });
});
