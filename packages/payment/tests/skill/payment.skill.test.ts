import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { createStripeMock } from '../../src/index.js';

/**
 * payment skill domain test — payment lib の主要 skill flow (sign / verify /
 * emit / handler) を spy 経路で assert する。
 */
describe('payment skill — Stripe mock skill flow', () => {
  it('T-SKL-D-001 signWebhook + verifyWebhook skill flow', () => {
    const spy = createToolSpy();
    const stripe = createStripeMock({ secret: 's' });
    const { rawBody, signature } = stripe.signWebhook({
      type: 't',
      amountCents: 100,
      customerId: 'c',
    });
    spy.record('payment.signWebhook', '{}');
    const result = stripe.verifyWebhook({ rawBody, signature });
    spy.record('payment.verifyWebhook', '{}');

    assertToolCallOrder(spy, ['payment.signWebhook', 'payment.verifyWebhook']);
    expect(result.ok).toBe(true);
  });

  it('T-SKL-D-002 onWebhook + emit skill flow', async () => {
    const spy = createToolSpy();
    const stripe = createStripeMock({ secret: 's' });
    stripe.onWebhook(() => undefined);
    spy.record('payment.onWebhook', '{}');
    const { event } = stripe.signWebhook({
      type: 't',
      amountCents: 100,
      customerId: 'c',
    });
    await stripe.emit(event);
    spy.record('payment.emit', '{}');

    assertToolCallOrder(spy, ['payment.onWebhook', 'payment.emit']);
  });

  it('T-SKL-D-003 batch sign skill (times=3)', () => {
    const spy = createToolSpy();
    const stripe = createStripeMock({ secret: 's' });
    stripe.signWebhook({ type: 't1', amountCents: 100, customerId: 'c' });
    spy.record('payment.signWebhook', '{}');
    stripe.signWebhook({ type: 't2', amountCents: 200, customerId: 'c' });
    spy.record('payment.signWebhook', '{}');
    stripe.signWebhook({ type: 't3', amountCents: 300, customerId: 'c' });
    spy.record('payment.signWebhook', '{}');

    assertToolCalled(spy, 'payment.signWebhook', { times: 3 });
  });

  it('T-SKL-D-004 error skill flow (bad signature retry)', () => {
    const spy = createToolSpy();
    const stripe = createStripeMock({ secret: 's' });
    const { rawBody, signature } = stripe.signWebhook({
      type: 't',
      amountCents: 100,
      customerId: 'c',
    });
    spy.record('payment.signWebhook', '{}');
    const bad = stripe.verifyWebhook({ rawBody, signature: 'bad' });
    spy.record('payment.verifyWebhook.bad', '{}');
    const good = stripe.verifyWebhook({ rawBody, signature });
    spy.record('payment.verifyWebhook.good', '{}');

    assertToolCallOrder(spy, ['payment.signWebhook', 'payment.verifyWebhook.bad', 'payment.verifyWebhook.good']);
    expect(bad.ok).toBe(false);
    expect(good.ok).toBe(true);
  });

  it('T-SKL-D-005 handler unregister skill flow', async () => {
    const spy = createToolSpy();
    const stripe = createStripeMock({ secret: 's' });
    let count = 0;
    const off = stripe.onWebhook(() => {
      count += 1;
    });
    spy.record('payment.onWebhook', '{}');
    const { event } = stripe.signWebhook({
      type: 't',
      amountCents: 100,
      customerId: 'c',
    });
    off();
    spy.record('payment.offWebhook', '{}');
    await stripe.emit(event);
    spy.record('payment.emit', '{}');

    assertToolCallOrder(spy, ['payment.onWebhook', 'payment.offWebhook', 'payment.emit']);
    expect(count).toBe(0);
  });
});
