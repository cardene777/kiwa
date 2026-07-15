/**
 * integration test — email domain の end-to-end workflow を 10 case で cover。
 * v2.1 で retry / batch / idempotency / observability / circuit-breaker 5 追加。
 */
import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  createEmailClient,
  verifyWebhookSignature,
  parseDeliveryEvent,
  sendWithRetry,
  sendBatch,
  createIdempotencyCache,
  sendIdempotent,
  createHookRegistry,
  sendObservable,
  createCircuitBreaker,
} from '../../src/index.js';

describe('email integration — send → webhook → parse workflow', () => {
  it('T-INT-E-001 send → delivery webhook を signature 検証 + parse まで通る', async () => {
    const client = createEmailClient({ provider: 'resend' });
    const secret = 'whsec_test';
    const { id } = await client.send({ from: 'a@x', to: 'b@x', subject: 's' });
    const payload = JSON.stringify({ type: 'email.delivered', email_id: id, timestamp: 1, recipient: 'b@x' });
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const verify = verifyWebhookSignature(payload, sig, secret, 'resend');
    expect(verify.valid).toBe(true);
    const event = parseDeliveryEvent({ provider: 'resend', raw: JSON.parse(payload) });
    expect(event.type).toBe('delivered');
    expect(event.emailId).toBe(id);
  });

  it('T-INT-E-002 template send で renderedHtml が listSent に保持される', async () => {
    const client = createEmailClient({ provider: 'sendgrid', templates: { welcome: '<h1>{{name}}</h1>' } });
    await client.send({ from: 'a@x', to: 'b@x', subject: 'w', templateId: 'welcome', templateData: { name: 'kiwa' } });
    expect(client.listSent()[0]!.renderedHtml).toBe('<h1>kiwa</h1>');
  });

  it('T-INT-E-003 provider 別 send で id prefix が異なる', async () => {
    const resend = createEmailClient({ provider: 'resend' });
    const sendgrid = createEmailClient({ provider: 'sendgrid' });
    const r1 = await resend.send({ from: 'a@x', to: 'b@x', subject: 's' });
    const s1 = await sendgrid.send({ from: 'a@x', to: 'b@x', subject: 's' });
    expect(r1.id.startsWith('re-')).toBe(true);
    expect(s1.id.startsWith('sg-')).toBe(true);
  });

  it('T-INT-E-004 bounced event を parseDeliveryEvent が正規化', () => {
    const event = parseDeliveryEvent({
      provider: 'postmark',
      raw: { RecordType: 'Bounce', MessageID: 'pm-1', Recipient: 'x@x', Details: 'hard-bounce' },
    });
    expect(event.type).toBe('bounced');
    expect(event.reason).toBe('hard-bounce');
  });

  it('T-INT-E-005 invalid signature が verify で reject される', () => {
    const result = verifyWebhookSignature('payload', 'wrong_sig', 'secret', 'sendgrid');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('T-INT-E-006 sendWithRetry: transient failure → retry → success', async () => {
    let attempt = 0;
    const client = createEmailClient({
      provider: 'resend',
      failOn: () => {
        attempt++;
        return attempt < 3;
      },
    });
    const retries: number[] = [];
    const result = await sendWithRetry(
      client,
      { from: 'a@x', to: 'b@x', subject: 's' },
      { maxAttempts: 5, initialDelayMs: 1, onRetry: (a) => retries.push(a) },
    );
    expect(result.attempts).toBe(3);
    expect(result.status).toBe('queued');
    expect(retries).toEqual([1, 2]);
  });

  it('T-INT-E-007 sendBatch: 10 message で concurrency 3 制御', async () => {
    const client = createEmailClient({ provider: 'resend' });
    const messages = Array.from({ length: 10 }, (_, i) => ({
      from: 'a@x',
      to: `u${i}@x`,
      subject: `s${i}`,
    }));
    const result = await sendBatch(client, messages, { concurrency: 3 });
    expect(result.total).toBe(10);
    expect(result.succeeded).toBe(10);
    expect(result.failed).toBe(0);
  });

  it('T-INT-E-008 sendIdempotent: 同 key で cached result 返却', async () => {
    const client = createEmailClient({ provider: 'resend' });
    const cache = createIdempotencyCache();
    const first = await sendIdempotent(client, { from: 'a@x', to: 'b@x', subject: 's' }, { cache, idempotencyKey: 'k-1' });
    expect(first.cached).toBe(false);
    const second = await sendIdempotent(client, { from: 'a@x', to: 'b@x', subject: 's' }, { cache, idempotencyKey: 'k-1' });
    expect(second.cached).toBe(true);
    expect(second.id).toBe(first.id);
    expect(client.listSent().length).toBe(1);
  });

  it('T-INT-E-009 sendObservable: before-send / after-send hook 発火', async () => {
    const client = createEmailClient({ provider: 'resend' });
    const hooks = createHookRegistry();
    const events: string[] = [];
    hooks.register('before-send', () => { events.push('before'); });
    hooks.register('after-send', (ctx) => { events.push(`after:${ctx.result?.status}`); });
    await sendObservable(client, { from: 'a@x', to: 'b@x', subject: 's' }, hooks);
    expect(events).toEqual(['before', 'after:queued']);
  });

  it('T-INT-E-010 circuit-breaker: 3 連続 failure → open → half-open で復帰', async () => {
    let currentTime = 1000;
    const client = createEmailClient({ provider: 'resend', failOn: () => currentTime < 5000 });
    const breaker = createCircuitBreaker(client, { failureThreshold: 3, resetTimeoutMs: 100, now: () => currentTime });
    for (let i = 0; i < 3; i++) await breaker.send({ from: 'a@x', to: 'b@x', subject: 's' });
    expect(breaker.state()).toBe('open');
    const blocked = await breaker.send({ from: 'a@x', to: 'b@x', subject: 's' });
    expect(blocked.reason).toContain('circuit breaker open');
    currentTime = 6000;
    const recovered = await breaker.send({ from: 'a@x', to: 'b@x', subject: 's' });
    expect(recovered.circuitState).toBe('closed');
  });
});
