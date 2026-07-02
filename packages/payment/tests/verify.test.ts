import { describe, expect, it } from 'vitest';
import { createPaddleMock, createStripeMock, createLemonSqueezyMock } from '../src/index.js';

describe('verifyWebhook — happy path', () => {
  it('stripe verifies its own signed body', () => {
    const stripe = createStripeMock();
    const { rawBody, signature } = stripe.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    const result = stripe.verifyWebhook({ rawBody, signature });
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('ok');
    expect(result.event?.provider).toBe('stripe');
  });

  it('paddle verifies its own signed body', () => {
    const paddle = createPaddleMock();
    const { rawBody, signature } = paddle.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    const result = paddle.verifyWebhook({ rawBody, signature });
    expect(result.ok).toBe(true);
  });

  it('lemonsqueezy verifies its own signed body', () => {
    const ls = createLemonSqueezyMock();
    const { rawBody, signature } = ls.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    const result = ls.verifyWebhook({ rawBody, signature });
    expect(result.ok).toBe(true);
  });
});

describe('verifyWebhook — failure modes', () => {
  it('rejects a tampered body with bad-signature', () => {
    const stripe = createStripeMock();
    const { rawBody, signature } = stripe.signWebhook({ type: 't', amountCents: 100, customerId: 'c' });
    // flip a byte in the payload — the signature is now invalid
    const tampered = rawBody.replace('"amountCents":100', '"amountCents":9999');
    const result = stripe.verifyWebhook({ rawBody: tampered, signature });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('bad-signature');
  });

  it('rejects a stale timestamp with stale-timestamp', () => {
    let now = 1_000_000;
    const stripe = createStripeMock({ now: () => now, toleranceMs: 1_000 });
    const { rawBody, signature } = stripe.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    now += 10_000;
    const result = stripe.verifyWebhook({ rawBody, signature });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('stale-timestamp');
  });

  it('rejects a malformed body with malformed-body', () => {
    const stripe = createStripeMock();
    const result = stripe.verifyWebhook({ rawBody: '{invalid', signature: 'x' });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('malformed-body');
  });

  it('rejects a body missing timestamp field', () => {
    const stripe = createStripeMock();
    const result = stripe.verifyWebhook({ rawBody: JSON.stringify({ id: 'evt_x' }), signature: 'x' });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('malformed-body');
  });

  it('respects per-call toleranceMs override', () => {
    let now = 100;
    const paddle = createPaddleMock({ now: () => now, toleranceMs: 100 });
    const { rawBody, signature } = paddle.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    now += 500;
    // default tolerance rejects, but per-call override accepts
    expect(paddle.verifyWebhook({ rawBody, signature }).reason).toBe('stale-timestamp');
    expect(paddle.verifyWebhook({ rawBody, signature, toleranceMs: 10_000 }).ok).toBe(true);
  });
});
