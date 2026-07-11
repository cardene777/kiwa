import { afterEach, describe, expect, it } from 'vitest';
import { setupSQSEnv, type SQSTestEnv } from '../src/index.js';

const envs: SQSTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

/**
 * Coverage batch 1 — stub-sqs guards + assertion helpers. The existing
 * suite covers happy path + T-SQS-021 (assertDeleted with a matching
 * receiveCount) but not the mismatch branches, createQueue name guard, or
 * listDeadLetters without a name filter.
 */

describe('setupSQSEnv (stub — createQueue guards)', () => {
  it('T-SQS-034 createQueue rejects an empty name', async () => {
    const env = await setupSQSEnv();
    envs.push(env);
    // createQueue is async and calls createQueueInternal synchronously, so
    // the guard throws before the promise resolves.
    await expect(
      env.createQueue({ name: '' } as unknown as { name: string }),
    ).rejects.toThrow(/`name` must be a non-empty string/);
  });
});

describe('setupSQSEnv (stub — assertDeleted guards)', () => {
  it('T-SQS-035 assertDeleted rejects when message actually landed in DLQ', async () => {
    const env = await setupSQSEnv({
      queues: [
        {
          name: 'q.main',
          redrivePolicy: { deadLetterTargetArn: 'q.dlq', maxReceiveCount: 1 },
        },
        { name: 'q.dlq' },
      ],
    });
    envs.push(env);
    await env.send('q.main', { attempt: 1 });
    // Receive without deleting — the visibility window expires and
    // maxReceiveCount=1 routes to DLQ on the next receive.
    const first = await env.receive('q.main', { visibilityTimeoutSeconds: 0 });
    expect(first).toHaveLength(1);
    await new Promise((r) => setTimeout(r, 5));
    await env.receive('q.main', { visibilityTimeoutSeconds: 0 });
    // Give the DLQ router a beat, then confirm assertDeleted rejects.
    await expect(env.assertDeleted('q.main')).rejects.toThrow(
      /expected message on "q.main" to be deleted/,
    );
  });

  it('T-SQS-036 assertDeleted rejects when receiveCount mismatches', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', { id: '1' });
    const received = await env.receive('q');
    received[0]?.delete();
    await expect(env.assertDeleted('q', { receiveCount: 99 })).rejects.toThrow(
      /expected 99 receive/,
    );
  });
});

describe('setupSQSEnv (stub — assertDeadLettered guards)', () => {
  it('T-SQS-037 assertDeadLettered rejects when the message was deleted (not dead-lettered)', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', { id: '1' });
    const received = await env.receive('q');
    received[0]?.delete();
    // The message is now in `deleted` state — waitForMessage returns it,
    // then assertDeadLettered rejects because state !== 'dead'.
    await expect(env.assertDeadLettered('q')).rejects.toThrow(
      /expected message on "q" to be dead-lettered/,
    );
  });

  it('T-SQS-038 assertDeadLettered rejects when receiveCount mismatches', async () => {
    const env = await setupSQSEnv({
      queues: [
        {
          name: 'q.main',
          redrivePolicy: { deadLetterTargetArn: 'q.dlq', maxReceiveCount: 1 },
        },
        { name: 'q.dlq' },
      ],
    });
    envs.push(env);
    await env.send('q.main', { id: 'ripe' });
    // Force one receive with a 0-second visibility window so the next receive
    // triggers DLQ routing (maxReceiveCount=1).
    await env.receive('q.main', { visibilityTimeoutSeconds: 0 });
    await new Promise((r) => setTimeout(r, 5));
    await env.receive('q.main', { visibilityTimeoutSeconds: 0 });
    await expect(
      env.assertDeadLettered('q.main', { receiveCount: 999 }),
    ).rejects.toThrow(/expected 999 receive/);
  });

  it('T-SQS-039 assertDeadLettered rejects when the message did not reach the named DLQ', async () => {
    const env = await setupSQSEnv({
      queues: [
        {
          name: 'q.main',
          redrivePolicy: { deadLetterTargetArn: 'q.dlq', maxReceiveCount: 1 },
        },
        { name: 'q.dlq' },
        { name: 'q.other' },
      ],
    });
    envs.push(env);
    await env.send('q.main', { id: 'ripe' });
    await env.receive('q.main', { visibilityTimeoutSeconds: 0 });
    await new Promise((r) => setTimeout(r, 5));
    await env.receive('q.main', { visibilityTimeoutSeconds: 0 });
    await expect(
      env.assertDeadLettered('q.main', { dlq: 'q.other' }),
    ).rejects.toThrow(/was not routed to DLQ "q.other"/);
  });
});

describe('setupSQSEnv (stub — listDeadLetters)', () => {
  it('T-SQS-040 listDeadLetters without a dlq name returns every DLQ entry', async () => {
    const env = await setupSQSEnv({
      queues: [
        {
          name: 'q.a',
          redrivePolicy: { deadLetterTargetArn: 'dlq.a', maxReceiveCount: 1 },
        },
        { name: 'dlq.a' },
        {
          name: 'q.b',
          redrivePolicy: { deadLetterTargetArn: 'dlq.b', maxReceiveCount: 1 },
        },
        { name: 'dlq.b' },
      ],
    });
    envs.push(env);
    await env.send('q.a', { id: 'a1' });
    await env.send('q.b', { id: 'b1' });
    // Kick each queue into DLQ with two 0-visibility receives.
    for (const q of ['q.a', 'q.b']) {
      await env.receive(q, { visibilityTimeoutSeconds: 0 });
      await new Promise((r) => setTimeout(r, 5));
      await env.receive(q, { visibilityTimeoutSeconds: 0 });
    }
    const all = env.listDeadLetters();
    expect(all.length).toBeGreaterThanOrEqual(2);
    // Also cover the named-DLQ path with the same env.
    const onlyA = env.listDeadLetters('dlq.a');
    expect(onlyA.length).toBeGreaterThanOrEqual(1);
  });
});
