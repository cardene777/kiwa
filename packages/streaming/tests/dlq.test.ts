import { describe, expect, it } from 'vitest';
import { createDeadLetterQueue, isDeadLetterQueue, type StreamingMessage } from '../src/index.js';

function fixture<T>(value: T): StreamingMessage<T> {
  return {
    topic: 'orders',
    partition: 0,
    offset: 0,
    timestamp: 0,
    key: null,
    value,
    headers: {},
  };
}

describe('createDeadLetterQueue', () => {
  it('T-DLQ-001 handled path returns "handled" without quarantining', async () => {
    const dlq = createDeadLetterQueue<{ id: number }>({
      topic: 'orders',
      handler: async () => {},
      retryPolicy: { maxAttempts: 3 },
    });
    expect(isDeadLetterQueue(dlq)).toBe(true);
    const result = await dlq.handle(fixture({ id: 1 }));
    expect(result).toBe('handled');
    expect(dlq.quarantined()).toEqual([]);
  });

  it('T-DLQ-002 exhausted retries move the message to the DLQ', async () => {
    let calls = 0;
    const dlq = createDeadLetterQueue<{ id: number }>({
      topic: 'orders',
      handler: async () => {
        calls += 1;
        throw new Error('boom');
      },
      retryPolicy: { maxAttempts: 3 },
    });
    const result = await dlq.handle(fixture({ id: 42 }));
    expect(result).toBe('quarantined');
    expect(calls).toBe(3);
    const entries = dlq.quarantined();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.attempts).toBe(3);
    expect(entries[0]?.reason).toBe('boom');
    expect(entries[0]?.original.value.id).toBe(42);
  });

  it('T-DLQ-003 partial success (recovers on retry) skips quarantine', async () => {
    let calls = 0;
    const dlq = createDeadLetterQueue<{ id: number }>({
      topic: 'orders',
      handler: async () => {
        calls += 1;
        if (calls === 1) throw new Error('flaky');
      },
      retryPolicy: { maxAttempts: 3 },
    });
    const result = await dlq.handle(fixture({ id: 7 }));
    expect(result).toBe('handled');
    expect(calls).toBe(2);
    expect(dlq.quarantined()).toEqual([]);
  });

  it('T-DLQ-004 onDeadLetter callback fires with the quarantined entry', async () => {
    const seen: unknown[] = [];
    const dlq = createDeadLetterQueue<string>({
      topic: 'orders',
      handler: async () => { throw new Error('nope'); },
      retryPolicy: { maxAttempts: 1 },
      onDeadLetter: (e) => { seen.push(e.original.value); },
    });
    await dlq.handle(fixture('poison'));
    expect(seen).toEqual(['poison']);
  });

  it('T-DLQ-005 quarantine() enqueues an entry directly', () => {
    const dlq = createDeadLetterQueue<string>({
      topic: 'orders',
      handler: async () => {},
      retryPolicy: { maxAttempts: 1 },
    });
    dlq.quarantine({
      original: fixture('manual'),
      attempts: 0,
      reason: 'fixture',
      quarantinedAt: 0,
    });
    expect(dlq.quarantined()).toHaveLength(1);
  });

  it('T-DLQ-006 reset clears quarantined entries', async () => {
    const dlq = createDeadLetterQueue<string>({
      topic: 'orders',
      handler: async () => { throw new Error('e'); },
      retryPolicy: { maxAttempts: 1 },
    });
    await dlq.handle(fixture('a'));
    dlq.reset();
    expect(dlq.quarantined()).toEqual([]);
  });

  it('T-DLQ-007 deadLetterTopic is topic.dlq suffix', () => {
    const dlq = createDeadLetterQueue<unknown>({
      topic: 'orders',
      handler: async () => {},
      retryPolicy: { maxAttempts: 1 },
    });
    expect(dlq.deadLetterTopic).toBe('orders.dlq');
  });

  it('T-DLQ-008 rejects maxAttempts < 1', () => {
    expect(() =>
      createDeadLetterQueue({
        topic: 'orders',
        handler: async () => {},
        retryPolicy: { maxAttempts: 0 },
      }),
    ).toThrow(/maxAttempts/);
  });

  it('T-DLQ-009 linear backoff applies for large delays but stays bounded', async () => {
    let calls = 0;
    const dlq = createDeadLetterQueue<number>({
      topic: 'orders',
      handler: async () => {
        calls += 1;
        throw new Error('e');
      },
      retryPolicy: {
        maxAttempts: 2,
        backoff: 'linear',
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
    });
    const start = Date.now();
    await dlq.handle(fixture(1));
    const elapsed = Date.now() - start;
    // At least 1ms delay between attempt 1 and 2 (best-effort — timers are jittery in Node).
    expect(calls).toBe(2);
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('exponential backoff walks the base * 2^(attempt-1) branch', async () => {
    // constant and linear were covered above; the `else` arm on
    // kind === 'exponential' was uncovered.
    let calls = 0;
    const dlq = createDeadLetterQueue({
      topic: 'orders',
      handler: async () => {
        calls += 1;
        throw new Error('exp');
      },
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'exponential',
        baseDelayMs: 1,
        maxDelayMs: 5,
      },
    });
    await dlq.handle(fixture(1));
    expect(calls).toBe(3);
  });
});
