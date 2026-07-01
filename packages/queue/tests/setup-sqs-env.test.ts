import { afterEach, describe, expect, it } from 'vitest';
import { setupSQSEnv, type SQSTestEnv } from '../src/index.js';

const envs: SQSTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupSQSEnv (defaults)', () => {
  it('T-SQS-001 defaults to stub backend when no mode is passed', async () => {
    const env = await setupSQSEnv();
    envs.push(env);
    expect(env.backend).toBe('stub');
    expect(env.mode).toBe('mock');
    expect(env.endpoint).toBeUndefined();
    expect(env.queues).toEqual([]);
  });

  it('T-SQS-002 pre-provisions queues from the specs list', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'emails' }, { name: 'notifications' }],
    });
    envs.push(env);
    expect(env.queues.sort()).toEqual(['emails', 'notifications']);
  });

  it('T-SQS-003 rejects an unknown mode', async () => {
    await expect(
      setupSQSEnv({ mode: 'invalid' as unknown as 'stub' }),
    ).rejects.toThrow(/unknown mode/);
  });

  it('T-SQS-004 rejects a localstack URL that is unreachable', async () => {
    await expect(
      setupSQSEnv({
        mode: 'localstack',
        localstack: { endpoint: 'http://127.0.0.1:1', startupTimeoutMs: 300 },
      }),
    ).rejects.toThrow(/did not respond/);
  });

  it('T-SQS-004b requires endpoint for localstack mode (v0.2 scope)', async () => {
    await expect(setupSQSEnv({ mode: 'localstack' })).rejects.toThrow(
      /requires localstack\.endpoint/,
    );
  });
});

describe('setupSQSEnv (standard queue — happy path)', () => {
  it('T-SQS-005 send then receive delivers the message body', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', { userId: 'u-1' });
    const received = await env.receive<{ userId: string }>('q');
    expect(received).toHaveLength(1);
    expect(received[0]?.body).toEqual({ userId: 'u-1' });
  });

  it('T-SQS-006 delete removes the message from the queue', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', { id: '1' });
    const received = await env.receive('q');
    received[0]?.delete();
    const again = await env.receive('q');
    expect(again).toHaveLength(0);
  });

  it('T-SQS-007 batch send accepts up to 10 entries', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    const snaps = await env.sendBatch(
      'q',
      Array.from({ length: 10 }, (_, i) => ({ id: `e${i}`, body: { n: i } })),
    );
    expect(snaps).toHaveLength(10);
    const received = await env.receive('q', { maxMessages: 10 });
    expect(received).toHaveLength(10);
  });

  it('T-SQS-008 batch send rejects >10 entries', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await expect(
      env.sendBatch(
        'q',
        Array.from({ length: 11 }, (_, i) => ({ id: `e${i}`, body: { n: i } })),
      ),
    ).rejects.toThrow(/caps at 10 entries/);
  });

  it('T-SQS-009 batch delete removes messages by receiptHandle', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.sendBatch('q', [
      { id: 'a', body: { id: 'a' } },
      { id: 'b', body: { id: 'b' } },
    ]);
    const received = await env.receive('q', { maxMessages: 10 });
    await env.deleteBatch(
      'q',
      received.map((r) => ({ id: r.messageId, receiptHandle: r.receiptHandle })),
    );
    const again = await env.receive('q');
    expect(again).toHaveLength(0);
  });

  it('T-SQS-010 batch delete rejects >10 entries', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await expect(
      env.deleteBatch(
        'q',
        Array.from({ length: 11 }, (_, i) => ({ id: `m${i}`, receiptHandle: 'r' })),
      ),
    ).rejects.toThrow(/caps at 10 entries/);
  });
});

describe('setupSQSEnv (visibility timeout)', () => {
  it('T-SQS-011 in-flight message reappears after visibility timeout expires', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'vt', visibilityTimeoutSeconds: 0.1 }],
    });
    envs.push(env);
    await env.send('vt', { id: '1' });
    const first = await env.receive('vt');
    expect(first).toHaveLength(1);
    // No delete — wait for visibility timeout to expire and re-receive.
    await new Promise((r) => setTimeout(r, 150));
    const second = await env.receive('vt');
    expect(second).toHaveLength(1);
    expect(second[0]?.receiveCount).toBe(2);
  });

  it('T-SQS-012 changeVisibility extends the in-flight window', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'vt2', visibilityTimeoutSeconds: 0.05 }],
    });
    envs.push(env);
    await env.send('vt2', { id: '1' });
    const first = await env.receive('vt2');
    first[0]?.changeVisibility(1); // Extend to 1s.
    // Wait for original 50ms to elapse — message must still be in-flight.
    await new Promise((r) => setTimeout(r, 100));
    const second = await env.receive('vt2');
    expect(second).toHaveLength(0);
  });

  it('T-SQS-013 per-receive visibilityTimeoutSeconds overrides queue default', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'q', visibilityTimeoutSeconds: 30 }],
    });
    envs.push(env);
    await env.send('q', { id: '1' });
    await env.receive('q', { visibilityTimeoutSeconds: 0.05 });
    await new Promise((r) => setTimeout(r, 100));
    const second = await env.receive('q');
    expect(second).toHaveLength(1);
    expect(second[0]?.receiveCount).toBe(2);
  });
});

describe('setupSQSEnv (DLQ / redrive policy)', () => {
  it('T-SQS-014 messages exceed maxReceiveCount route to DLQ', async () => {
    const env = await setupSQSEnv({
      queues: [
        {
          name: 'src',
          visibilityTimeoutSeconds: 0.05,
          redrivePolicy: { deadLetterTargetArn: 'dlq', maxReceiveCount: 2 },
        },
        { name: 'dlq' },
      ],
    });
    envs.push(env);
    await env.send('src', { id: '1' });
    // Receive it 3 times — the 3rd exceeds maxReceiveCount and routes to DLQ.
    await env.receive('src');
    await new Promise((r) => setTimeout(r, 100));
    await env.receive('src');
    await new Promise((r) => setTimeout(r, 100));
    await env.receive('src');
    const snap = await env.assertDeadLettered('src', {
      dlq: 'dlq',
      receiveCount: 3,
    });
    expect(snap.state).toBe('dead');
    expect(env.listDeadLetters('dlq')).toHaveLength(1);
  });
});

describe('setupSQSEnv (FIFO queue)', () => {
  it('T-SQS-015 FIFO queue requires .fifo suffix on the name', async () => {
    const env = await setupSQSEnv();
    envs.push(env);
    await expect(
      env.createQueue({ name: 'no-suffix', kind: 'fifo' }),
    ).rejects.toThrow(/must end with "\.fifo"/);
  });

  it('T-SQS-016 FIFO send requires messageGroupId', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'q.fifo', kind: 'fifo' }],
    });
    envs.push(env);
    await expect(env.send('q.fifo', { id: '1' })).rejects.toThrow(
      /requires messageGroupId/,
    );
  });

  it('T-SQS-017 FIFO deduplication returns the existing message for duplicate dedup id', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'q.fifo', kind: 'fifo' }],
    });
    envs.push(env);
    const first = await env.send(
      'q.fifo',
      { id: 'a' },
      { messageGroupId: 'g', messageDeduplicationId: 'dedup-1' },
    );
    const second = await env.send(
      'q.fifo',
      { id: 'b' },
      { messageGroupId: 'g', messageDeduplicationId: 'dedup-1' },
    );
    // Second send returns the first message's snapshot (dedup hit).
    expect(second.messageId).toBe(first.messageId);
    const messages = env.listMessages('q.fifo');
    expect(messages).toHaveLength(1);
  });

  it('T-SQS-018 FIFO different dedup id creates distinct messages', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'q.fifo', kind: 'fifo' }],
    });
    envs.push(env);
    const first = await env.send(
      'q.fifo',
      { id: 'a' },
      { messageGroupId: 'g', messageDeduplicationId: 'd1' },
    );
    const second = await env.send(
      'q.fifo',
      { id: 'b' },
      { messageGroupId: 'g', messageDeduplicationId: 'd2' },
    );
    expect(second.messageId).not.toBe(first.messageId);
  });

  it('T-SQS-019 FIFO receive surfaces messageGroupId + messageDeduplicationId', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'q.fifo', kind: 'fifo' }],
    });
    envs.push(env);
    await env.send(
      'q.fifo',
      { id: '1' },
      { messageGroupId: 'group-a', messageDeduplicationId: 'd1' },
    );
    const received = await env.receive('q.fifo');
    expect(received[0]?.messageGroupId).toBe('group-a');
    expect(received[0]?.messageDeduplicationId).toBe('d1');
  });
});

describe('setupSQSEnv (assertion helpers)', () => {
  it('T-SQS-020 waitForMessage rejects on timeout when nothing terminal happens', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', { id: '1' });
    await expect(
      env.waitForMessage('q', { timeoutMs: 200 }),
    ).rejects.toThrow(/timeout waiting for queue "q"/);
  });

  it('T-SQS-021 assertDeleted with expected receiveCount matches', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', { id: '1' });
    const received = await env.receive('q');
    received[0]?.delete();
    const snap = await env.assertDeleted('q', { receiveCount: 1 });
    expect(snap.state).toBe('deleted');
  });

  it('T-SQS-022 assertQueueDrained without a queue argument drains every queue', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'a' }, { name: 'b' }],
    });
    envs.push(env);
    await env.send('a', { id: '1' });
    await env.send('b', { id: '2' });
    const ra = await env.receive('a');
    const rb = await env.receive('b');
    ra[0]?.delete();
    rb[0]?.delete();
    await env.assertQueueDrained();
  });

  it('T-SQS-023 assertQueueDrained throws when a message is stuck pending', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'stuck' }] });
    envs.push(env);
    await env.send('stuck', { id: '1' });
    await expect(env.assertQueueDrained('stuck')).rejects.toThrow(
      /still have pending/,
    );
  });

  it('T-SQS-024 waitForMessage rejects on timeout when nothing terminal happens', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', { id: '1' });
    await expect(
      env.waitForMessage('q', { timeoutMs: 200 }),
    ).rejects.toThrow(/timeout/);
  });
});

describe('setupSQSEnv (send options)', () => {
  it('T-SQS-025 rejects negative delaySeconds', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await expect(env.send('q', {}, { delaySeconds: -1 })).rejects.toThrow(
      /delaySeconds must be non-negative/,
    );
  });

  it('T-SQS-026 rejects delaySeconds > 900', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await expect(env.send('q', {}, { delaySeconds: 901 })).rejects.toThrow(
      /cannot exceed 900/,
    );
  });

  it('T-SQS-027 delayed sends become visible after delaySeconds window opens', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'delayed' }] });
    envs.push(env);
    await env.send('delayed', { id: '1' }, { delaySeconds: 0.1 });
    // Poll for a short window — receive should get the message after 100ms.
    const first = await env.receive('delayed');
    expect(first).toHaveLength(0);
    await new Promise((r) => setTimeout(r, 150));
    const second = await env.receive('delayed');
    expect(second).toHaveLength(1);
  });

  it('T-SQS-028 rejects empty queue name on send', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await expect(env.send('', {})).rejects.toThrow(/non-empty string/);
  });

  it('T-SQS-029 rejects send on non-existent queue', async () => {
    const env = await setupSQSEnv();
    envs.push(env);
    await expect(env.send('missing', {})).rejects.toThrow(/does not exist/);
  });
});

describe('setupSQSEnv (long polling)', () => {
  it('T-SQS-030 waitTimeSeconds returns messages arriving during the poll window', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'lp' }] });
    envs.push(env);
    const receivePromise = env.receive('lp', { waitTimeSeconds: 1 });
    // Publish after 30ms — receive should complete inside the poll window.
    setTimeout(() => {
      void env.send('lp', { id: 'late' });
    }, 30);
    const received = await receivePromise;
    expect(received).toHaveLength(1);
  });

  it('T-SQS-031 waitTimeSeconds returns empty when nothing arrives', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'silent' }] });
    envs.push(env);
    const t0 = Date.now();
    const received = await env.receive('silent', { waitTimeSeconds: 0.1 });
    const elapsed = Date.now() - t0;
    expect(received).toHaveLength(0);
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});

describe('setupSQSEnv (lifecycle)', () => {
  it('T-SQS-032 stop() prevents further sends and clears state', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    await env.send('q', { id: '1' });
    await env.stop();
    await expect(env.send('q', { id: '2' })).rejects.toThrow(
      /cannot use env after stop/,
    );
  });

  it('T-SQS-033 listMessages without a queue argument returns every message', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'a' }, { name: 'b' }],
    });
    envs.push(env);
    await env.send('a', { id: '1' });
    await env.send('b', { id: '2' });
    const all = env.listMessages();
    expect(all.map((m) => m.queueName).sort()).toEqual(['a', 'b']);
  });
});
