import type { QueueClient } from './types.js';

export interface IdempotencyOptions {
  dedupKey: string;
}

/**
 * Asserts that two sends with the same dedupKey collapse into one queue entry
 * (caller is expected to consume + ack the entry).
 */
export async function expectIdempotent<T>(
  client: QueueClient<T>,
  body: T,
  opts: IdempotencyOptions,
  expect: { (actual: unknown): { toBe: (expected: unknown) => void } },
): Promise<void> {
  const initialSize = client.size();
  client.send(body, opts);
  client.send(body, opts);
  expect(client.size()).toBe(initialSize + 1);
}

/**
 * Asserts that a handler is invoked at least `minTimes` for a message that nacks
 * before finally acking (at-least-once delivery semantics).
 */
export async function expectAtLeastOnce<T>(
  client: QueueClient<T>,
  body: T,
  minTimes: number,
  expect: { (actual: unknown): { toBeGreaterThanOrEqual: (expected: number) => void } },
): Promise<number> {
  let invocations = 0;
  const unsubscribe = client.consume(async (_message, ack) => {
    invocations += 1;
    if (invocations < minTimes) {
      ack.nack();
    } else {
      ack.ack();
    }
  });
  client.send(body);
  await new Promise((r) => setTimeout(r, 10));
  unsubscribe();
  expect(invocations).toBeGreaterThanOrEqual(minTimes);
  return invocations;
}
