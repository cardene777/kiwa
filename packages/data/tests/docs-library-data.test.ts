import { expect, test } from 'vitest';
import { createFakeClock, setupQueueEnv } from '../src/index.js';

test('the quickstart retries before it acknowledges a message', async () => {
  const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 3 });
  try {
    let deliveries = 0;
    const done = new Promise<void>((resolve) => {
      const unsubscribe = env.client.consume((_message, ack) => {
        deliveries += 1;
        if (deliveries < 3) ack.nack();
        else {
          ack.ack();
          unsubscribe();
          resolve();
        }
      });
    });
    env.client.send('refresh');
    await done;
    expect(deliveries).toBe(3);
    expect(env.client.size()).toBe(0);
    expect(env.client.dlqSize()).toBe(0);
  } finally {
    await env.stop();
  }
});

test('the how-to covers deduplication, DLQ, and a deterministic clock', async () => {
  const dedup = await setupQueueEnv<{ version: number }>({ mode: 'mock' });
  try {
    const first = dedup.client.send({ version: 1 }, { dedupKey: 'daily-sync' });
    expect(dedup.client.send({ version: 2 }, { dedupKey: 'daily-sync' })).toBe(first);
    expect(dedup.client.size()).toBe(1);
  } finally {
    await dedup.stop();
  }

  const dlq = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 2 });
  try {
    let deliveries = 0;
    const done = new Promise<void>((resolve) => {
      const unsubscribe = dlq.client.consume((_message, ack) => {
        deliveries += 1;
        ack.nack();
        if (deliveries === 2) {
          unsubscribe();
          resolve();
        }
      });
    });
    dlq.client.send('always-fails');
    await done;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(dlq.client.drainDlq()[0]).toMatchObject({ body: 'always-fails', receivedCount: 2 });
  } finally {
    await dlq.stop();
  }

  const clock = createFakeClock({ startMs: 0 });
  const fired: number[] = [];
  const id = clock.schedule(100, () => {
    fired.push(clock.nowMs());
  });
  await clock.advanceMs(350);
  clock.unschedule(id);
  expect(fired).toEqual([100, 200, 300]);
});
