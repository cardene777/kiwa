import { describe, expect, it } from 'vitest';
import { createDeadLetterQueue } from '../src/dlq.js';
import type { StreamingMessage } from '../src/types.js';

const makeMsg = (value: string): StreamingMessage<string, string> => ({
  topic: 'my-topic',
  partition: 0,
  offset: 0,
  timestamp: 0,
  key: 'k',
  value,
  headers: {},
});

describe('createDeadLetterQueue defensive branches', () => {
  it('throws when maxAttempts < 1', () => {
    expect(() =>
      createDeadLetterQueue({
        topic: 'my-topic',
        handler: async () => undefined,
        retryPolicy: { maxAttempts: 0 },
      }),
    ).toThrow(/maxAttempts must be >= 1/);
  });

  it('handles message successfully on first attempt', async () => {
    const dlq = createDeadLetterQueue({
      topic: 'my-topic',
      handler: async () => undefined,
      retryPolicy: { maxAttempts: 3 },
    });
    const result = await dlq.handle(makeMsg('hello'));
    expect(result).toBe('handled');
  });

  it('retries and eventually succeeds', async () => {
    let attempts = 0;
    const dlq = createDeadLetterQueue({
      topic: 'my-topic',
      handler: async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('flake');
      },
      retryPolicy: { maxAttempts: 5 },
    });
    const result = await dlq.handle(makeMsg('retry-me'));
    expect(result).toBe('handled');
    expect(attempts).toBe(3);
  });

  it('quarantines message after all retries fail', async () => {
    const dlq = createDeadLetterQueue({
      topic: 'my-topic',
      handler: async () => {
        throw new Error('persistent');
      },
      retryPolicy: { maxAttempts: 2 },
    });
    const result = await dlq.handle(makeMsg('bad'));
    expect(result).toBe('quarantined');
    expect(dlq.quarantined().length).toBeGreaterThan(0);
  });

  it('invokes onDeadLetter callback when message quarantined', async () => {
    let callbackFired = false;
    const dlq = createDeadLetterQueue({
      topic: 'my-topic',
      handler: async () => {
        throw new Error('always');
      },
      retryPolicy: { maxAttempts: 1 },
      onDeadLetter: () => {
        callbackFired = true;
      },
    });
    await dlq.handle(makeMsg('x'));
    expect(callbackFired).toBe(true);
  });

  it('backoff linear applies attempt-based delay', async () => {
    const dlq = createDeadLetterQueue({
      topic: 'my-topic',
      handler: async () => undefined,
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'linear',
        baseDelayMs: 1,
      },
    });
    const result = await dlq.handle(makeMsg('x'));
    expect(result).toBe('handled');
  });

  it('backoff exponential applies power-based delay', async () => {
    const dlq = createDeadLetterQueue({
      topic: 'my-topic',
      handler: async () => undefined,
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'exponential',
        baseDelayMs: 1,
        maxDelayMs: 10,
      },
    });
    const result = await dlq.handle(makeMsg('x'));
    expect(result).toBe('handled');
  });

  it('backoff constant with base=0 short-circuits delay', async () => {
    const dlq = createDeadLetterQueue({
      topic: 'my-topic',
      handler: async () => undefined,
      retryPolicy: { maxAttempts: 2, backoff: 'constant', baseDelayMs: 0 },
    });
    const result = await dlq.handle(makeMsg('x'));
    expect(result).toBe('handled');
  });

  it('deadLetterTopic exposes topic.dlq suffix', () => {
    const dlq = createDeadLetterQueue({
      topic: 'orders',
      handler: async () => undefined,
      retryPolicy: { maxAttempts: 1 },
    });
    expect(dlq.deadLetterTopic).toBe('orders.dlq');
  });
});
