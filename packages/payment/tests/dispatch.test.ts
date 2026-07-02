import { describe, expect, it } from 'vitest';
import { createStripeMock, createPaddleMock } from '../src/index.js';

describe('onWebhook + emit dispatch', () => {
  it('registered handler receives emitted event', async () => {
    const stripe = createStripeMock();
    const received: string[] = [];
    stripe.onWebhook((e) => {
      received.push(e.type);
    });
    const { event } = stripe.signWebhook({ type: 'checkout.completed', amountCents: 100, customerId: 'c' });
    await stripe.emit(event);
    expect(received).toEqual(['checkout.completed']);
  });

  it('multiple handlers all receive event', async () => {
    const stripe = createStripeMock();
    const received: string[] = [];
    stripe.onWebhook(() => {
      received.push('h1');
    });
    stripe.onWebhook(() => {
      received.push('h2');
    });
    const { event } = stripe.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    await stripe.emit(event);
    expect(received).toEqual(['h1', 'h2']);
  });

  it('handler async errors propagate', async () => {
    const paddle = createPaddleMock();
    paddle.onWebhook(async () => {
      throw new Error('boom');
    });
    const { event } = paddle.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    await expect(paddle.emit(event)).rejects.toThrow('boom');
  });

  it('returned dispose removes handler', async () => {
    const stripe = createStripeMock();
    const received: string[] = [];
    const dispose = stripe.onWebhook((e) => {
      received.push(e.type);
    });
    const { event } = stripe.signWebhook({ type: 'first', amountCents: 1, customerId: 'c' });
    await stripe.emit(event);
    dispose();
    const { event: second } = stripe.signWebhook({ type: 'second', amountCents: 1, customerId: 'c' });
    await stripe.emit(second);
    expect(received).toEqual(['first']);
  });
});
