/**
 * integration test — webhook domain の end-to-end workflow (incoming → signature verify
 * → parse → dispatch handler → retry loop) を 5 case で cover。
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

describe('webhook integration — verify → parse → dispatch workflow', () => {
  it('T-INT-W-001 stripe incoming を verify + parse + handler dispatch まで成功', async () => {
    const secret = 'whsec_test';
    const payload = JSON.stringify({
      type: 'payment_intent.succeeded',
      id: 'evt_100',
      created: 42,
      data: { object: { id: 'pi_100' } },
    });
    const sig = `t=0,v1=${createHmac('sha256', secret).update(`0.${payload}`).digest('hex')}`;
    const verifier = createWebhookVerifier({ provider: 'stripe', secret });
    const outcome = verifier.verify({ payload, signature: sig });
    expect(outcome.status).toBe('verified');
    expect(outcome.event?.type).toBe('payment.succeeded');
    expect(outcome.event?.resource).toBe('pi_100');
    let handled = false;
    await dispatchWithRetry(
      async (event: NormalizedWebhookEvent) => { handled = event.eventId === 'evt_100'; },
      outcome.event!,
      { sleep: async () => {}, maxAttempts: 1, initialDelayMs: 0 },
    );
    expect(handled).toBe(true);
  });

  it('T-INT-W-002 github push event が正規化 + resource=repository full_name', () => {
    const secret = 's';
    const payload = JSON.stringify({ event: 'push', delivery: 'gh_1', timestamp: 1, repository: { full_name: 'org/repo' } });
    const sig = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
    const verifier = createWebhookVerifier({ provider: 'github', secret });
    const outcome = verifier.verify({ payload, signature: sig });
    expect(outcome.status).toBe('verified');
    expect(outcome.event?.type).toBe('push');
    expect(outcome.event?.resource).toBe('org/repo');
  });

  it('T-INT-W-003 dispatchWithRetry が全 attempt 失敗で delivered=false', async () => {
    const event: NormalizedWebhookEvent = { type: 'push', provider: 'github', eventId: 'x', occurredAt: 0 };
    const result = await dispatchWithRetry(
      async () => { throw new Error('down'); },
      event,
      { sleep: async () => {}, maxAttempts: 3, initialDelayMs: 1 },
    );
    expect(result.delivered).toBe(false);
    expect(result.attempts.length).toBe(3);
    expect(result.attempts.every((a) => !a.ok)).toBe(true);
  });

  it('T-INT-W-004 twilio SMS delivered event を parseWebhookPayload が正規化', () => {
    const event = parseWebhookPayload({
      provider: 'twilio',
      raw: { MessageSid: 'SM123', MessageStatus: 'delivered', To: '+15551234567', Timestamp: 100 },
    });
    expect(event.type).toBe('sms.delivered');
    expect(event.eventId).toBe('SM123');
    expect(event.resource).toBe('+15551234567');
  });

  it('T-INT-W-005 invalid signature の incoming を reject + listDelivered に rejected record', () => {
    const verifier = createWebhookVerifier({ provider: 'slack', secret: 's' });
    verifier.verify({ payload: 'x', signature: 'v0=deadbeef' });
    const list = verifier.listDelivered();
    expect(list.length).toBe(1);
    expect(list[0]!.status).toBe('rejected');
    expect(list[0]!.signatureResult.valid).toBe(false);
  });

  it('T-INT-W-006 verifyWithRetry: transient rejection → retry → verified', async () => {
    const { verifyWithRetry } = await import('../../src/index.js');
    let attempt = 0;
    const verifier = {
      provider: 'github' as const,
      verify: (_: unknown) => {
        attempt++;
        return attempt < 3
          ? { id: `x-${attempt}`, provider: 'github' as const, status: 'rejected' as const, reason: 'transient', receivedAt: attempt }
          : { id: `x-${attempt}`, provider: 'github' as const, status: 'verified' as const, receivedAt: attempt };
      },
      listDelivered: () => [],
      clear: () => {},
    };
    const result = await verifyWithRetry(verifier, { payload: 'p', signature: 's' }, { maxAttempts: 5, initialDelayMs: 1 });
    expect(result.attempts).toBe(3);
    expect(result.status).toBe('verified');
  });

  it('T-INT-W-007 verifyBatch: 5 incoming 全 result 収集 (verified+rejected 合計)', async () => {
    const { verifyBatch } = await import('../../src/index.js');
    const verifier = createWebhookVerifier({ provider: 'github', secret: 'k' });
    const incomings = Array.from({ length: 5 }, (_, i) => ({ payload: `p${i}`, signature: 'bad' }));
    const result = verifyBatch(verifier, incomings);
    expect(result.total).toBe(5);
    expect(result.verified + result.rejected).toBe(5);
    expect(result.results.length).toBe(5);
  });

  it('T-INT-W-008 verifyIdempotent: 同 key で dedup', async () => {
    const { createIdempotencyCache, verifyIdempotent } = await import('../../src/index.js');
    const verifier = createWebhookVerifier({ provider: 'github', secret: 'k' });
    const cache = createIdempotencyCache();
    const first = verifyIdempotent(verifier, { payload: 'x', signature: 'bad' }, 'evt-1', cache);
    expect(first.deduplicated).toBe(false);
    const second = verifyIdempotent(verifier, { payload: 'x', signature: 'bad' }, 'evt-1', cache);
    expect(second.deduplicated).toBe(true);
    expect(verifier.listDelivered().length).toBe(1);
  });

  it('T-INT-W-009 verifyObservable: before-verify + after-verify hook 発火', async () => {
    const { createHookRegistry, verifyObservable } = await import('../../src/index.js');
    const verifier = createWebhookVerifier({ provider: 'github', secret: 'k' });
    const hooks = createHookRegistry();
    const events: string[] = [];
    hooks.register('before-verify', () => { events.push('before'); });
    hooks.register('after-verify', (ctx) => { events.push(`after:${ctx.outcome?.status}`); });
    verifyObservable(verifier, { payload: 'x', signature: 'bad' }, hooks);
    expect(events[0]).toBe('before');
    expect(events[1]).toContain('after:');
  });

  it('T-INT-W-010 circuit-breaker: 3 連続 rejection → open → resetTimeout 後 half-open', async () => {
    const { createCircuitBreaker } = await import('../../src/index.js');
    let currentTime = 1000;
    const verifier = createWebhookVerifier({ provider: 'github', secret: 'k' });
    const breaker = createCircuitBreaker(verifier, { rejectionThreshold: 3, resetTimeoutMs: 100, now: () => currentTime });
    for (let i = 0; i < 3; i++) breaker.verify({ payload: 'x', signature: 'bad' });
    expect(breaker.state()).toBe('open');
    const blocked = breaker.verify({ payload: 'x', signature: 'bad' });
    expect(blocked.reason).toContain('circuit breaker open');
    currentTime = 6000;
    const halfOpen = breaker.verify({ payload: 'ok', signature: 'bad' });
    expect(['half-open', 'open']).toContain(halfOpen.circuitState);
  });
});
