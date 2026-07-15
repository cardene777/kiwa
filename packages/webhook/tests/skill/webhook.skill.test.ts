/**
 * skill test — webhook skill が主要 API 4 種 (createWebhookVerifier /
 * verifyWebhookSignature / parseWebhookPayload / dispatchWithRetry) を全て公開
 * している + 4 provider (stripe/github/slack/twilio) を扱えることを assertion する。
 */
import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  createWebhookVerifier,
  verifyWebhookSignature,
  parseWebhookPayload,
  dispatchWithRetry,
  type NormalizedWebhookEvent,
} from '../../src/index.js';

describe('webhook skill assertions', () => {
  it('createWebhookVerifier を 4 provider (stripe/github/slack/twilio) 全てで instantiate 可能', () => {
    for (const provider of ['stripe', 'github', 'slack', 'twilio'] as const) {
      const v = createWebhookVerifier({ provider, secret: 's' });
      expect(v.provider).toBe(provider);
    }
  });

  it('verifyWebhookSignature が 4 provider の署名 format で valid 判定', () => {
    const secret = 's';
    const payload = 'body';
    const stripeSig = `t=0,v1=${createHmac('sha256', secret).update(`0.${payload}`).digest('hex')}`;
    const githubSig = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
    const slackSig = `v0=${createHmac('sha256', secret).update(`v0:${payload}`).digest('hex')}`;
    const twilioSig = createHmac('sha1', secret).update(payload).digest('base64');
    expect(verifyWebhookSignature(payload, stripeSig, secret, 'stripe').valid).toBe(true);
    expect(verifyWebhookSignature(payload, githubSig, secret, 'github').valid).toBe(true);
    expect(verifyWebhookSignature(payload, slackSig, secret, 'slack').valid).toBe(true);
    expect(verifyWebhookSignature(payload, twilioSig, secret, 'twilio').valid).toBe(true);
  });

  it('parseWebhookPayload が provider 別 event を正規化 shape に変換', () => {
    const stripe = parseWebhookPayload({ provider: 'stripe', raw: { type: 'payment_intent.succeeded', id: 'evt_1', created: 100 } });
    expect(stripe.type).toBe('payment.succeeded');
    expect(stripe.eventId).toBe('evt_1');
    const gh = parseWebhookPayload({ provider: 'github', raw: { event: 'push', delivery: 'gh_1', timestamp: 100 } });
    expect(gh.type).toBe('push');
  });

  it('dispatchWithRetry が失敗 → retry → 成功する', async () => {
    let n = 0;
    const noopSleep = async (_ms: number) => { /* zero delay */ };
    const event: NormalizedWebhookEvent = { type: 'push', provider: 'github', eventId: 'gh_1', occurredAt: 0 };
    const result = await dispatchWithRetry(
      async () => { n += 1; if (n < 3) throw new Error('t'); },
      event,
      { sleep: noopSleep, maxAttempts: 5, initialDelayMs: 1 },
    );
    expect(result.delivered).toBe(true);
    expect(result.attempts.length).toBe(3);
    expect(result.attempts.at(-1)!.ok).toBe(true);
  });

  it('WebhookVerifier.listDelivered が verified + rejected record 両方を保持', () => {
    const secret = 's';
    const v = createWebhookVerifier({ provider: 'github', secret });
    const jsonBody = JSON.stringify({ event: 'push', delivery: 'gh_1', timestamp: 1 });
    const validSig = `sha256=${createHmac('sha256', secret).update(jsonBody).digest('hex')}`;
    v.verify({ payload: jsonBody, signature: validSig });
    v.verify({ payload: jsonBody, signature: 'sha256=bad' });
    const list = v.listDelivered();
    expect(list.length).toBe(2);
    expect(list.map((r) => r.status)).toEqual(['verified', 'rejected']);
  });
});
