import { describe, expect, it } from 'vitest';
import { createStubSQSEnv } from '../src/sqs/stub-sqs.js';
import type { SQSQueueSpec } from '../src/sqs/types.js';

describe('stub-sqs defensive branches', () => {
  it('createQueue throws when name is empty string', async () => {
    const env = createStubSQSEnv({ queues: [] });
    await expect(env.createQueue({ name: '' })).rejects.toThrow(
      /`name` must be a non-empty string/,
    );
  });

  it('createQueue throws when name is not a string', async () => {
    const env = createStubSQSEnv({ queues: [] });
    await expect(
      env.createQueue({ name: 42 as unknown as string }),
    ).rejects.toThrow(/`name` must be a non-empty string/);
  });

  it('createQueue FIFO requires name ending with .fifo', async () => {
    const env = createStubSQSEnv({ queues: [] });
    const spec: SQSQueueSpec = { name: 'my-fifo', kind: 'fifo' };
    await expect(env.createQueue(spec)).rejects.toThrow(
      /FIFO queue name .* must end with "\.fifo"/,
    );
  });

  it('createQueue FIFO accepts valid .fifo name', async () => {
    const env = createStubSQSEnv({ queues: [] });
    const spec: SQSQueueSpec = { name: 'my-queue.fifo', kind: 'fifo' };
    await expect(env.createQueue(spec)).resolves.toBeUndefined();
  });

  it('waitForMessage times out when queue has no delivered message', async () => {
    const env = createStubSQSEnv({ queues: [{ name: 'q1' }] });
    await expect(
      env.waitForMessage('q1', { timeoutMs: 30 }),
    ).rejects.toThrow(/timeout waiting for queue "q1"/);
  });

  it('send + receive round trip returns the message body', async () => {
    const env = createStubSQSEnv({ queues: [{ name: 'q1' }] });
    await env.send('q1', { hello: 'world' } as unknown);
    const msgs = await env.receive('q1', { maxMessages: 1 });
    expect(msgs.length).toBe(1);
    expect((msgs[0]?.body as { hello: string })?.hello).toBe('world');
  });

  it('preseeded queues via options are declared', () => {
    const env = createStubSQSEnv({ queues: [{ name: 'seed-q' }] });
    expect(env.queues).toContain('seed-q');
  });
});
