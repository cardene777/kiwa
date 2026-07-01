import { afterEach, describe, expect, it } from 'vitest';
import {
  setupCloudflareQueuesEnv,
  type CloudflareQueueBatch,
  type CloudflareQueuesTestEnv,
} from '../src/index.js';

const envs: CloudflareQueuesTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupCloudflareQueuesEnv (defaults)', () => {
  it('T-CFQ-001 defaults to miniflare backend when no mode is passed', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    expect(env.backend).toBe('miniflare');
    expect(env.mode).toBe('mock');
    expect(env.devServerUrl).toBeUndefined();
    expect(env.queues).toEqual([]);
  });

  it('T-CFQ-002 pre-provisions queues from the options list', async () => {
    const env = await setupCloudflareQueuesEnv({ queues: ['emails', 'notifications'] });
    envs.push(env);
    expect(env.queues.sort()).toEqual(['emails', 'notifications']);
  });

  it('T-CFQ-003 rejects an unknown mode', async () => {
    await expect(
      setupCloudflareQueuesEnv({ mode: 'invalid' as unknown as 'miniflare' }),
    ).rejects.toThrow(/unknown mode/);
  });

  it('T-CFQ-004 rejects a wrangler URL that is unreachable', async () => {
    // 127.0.0.1:1 is refused by the kernel — a fast, deterministic failure
    // that avoids any real network dependency.
    await expect(
      setupCloudflareQueuesEnv({
        mode: 'wrangler',
        wrangler: { url: 'http://127.0.0.1:1', startupTimeoutMs: 300 },
      }),
    ).rejects.toThrow(/did not respond/);
  });
});

describe('setupCloudflareQueuesEnv (miniflare — happy path)', () => {
  it('T-CFQ-005 delivers a message to a registered consumer and acks it', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const observed: string[] = [];
    env.registerConsumer<{ userId: string }>({
      queue: 'emails',
      handler: (batch) => {
        for (const msg of batch.messages) {
          observed.push(msg.body.userId);
          msg.ack();
        }
      },
    });
    await env.send('emails', { userId: 'u-1' });
    const snap = await env.assertAcknowledged<{ userId: string }>('emails');
    expect(snap.state).toBe('ack');
    expect(snap.attempts).toBe(1);
    expect(observed).toEqual(['u-1']);
  });

  it('T-CFQ-006 batches multiple sends into one consumer invocation', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const seenBatches: number[] = [];
    env.registerConsumer<{ n: number }>({
      queue: 'batch-queue',
      maxBatchSize: 100,
      handler: (batch: CloudflareQueueBatch<{ n: number }>) => {
        seenBatches.push(batch.messages.length);
        batch.ackAll();
      },
    });
    // Kick off three sends before yielding — the scheduler should coalesce
    // them into a single delivered batch because the consumer is registered
    // ahead of time and maxBatchSize is well above the send count.
    await Promise.all([
      env.send('batch-queue', { n: 1 }),
      env.send('batch-queue', { n: 2 }),
      env.send('batch-queue', { n: 3 }),
    ]);
    await env.assertQueueDrained('batch-queue');
    expect(seenBatches).toEqual([3]);
  });

  it('T-CFQ-007 respects maxBatchSize when chunking pending messages', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const seenBatches: number[] = [];
    env.registerConsumer<{ n: number }>({
      queue: 'chunk-queue',
      maxBatchSize: 2,
      handler: (batch) => {
        seenBatches.push(batch.messages.length);
        batch.ackAll();
      },
    });
    await Promise.all([
      env.send('chunk-queue', { n: 1 }),
      env.send('chunk-queue', { n: 2 }),
      env.send('chunk-queue', { n: 3 }),
      env.send('chunk-queue', { n: 4 }),
      env.send('chunk-queue', { n: 5 }),
    ]);
    await env.assertQueueDrained('chunk-queue');
    expect(seenBatches).toEqual([2, 2, 1]);
  });
});

describe('setupCloudflareQueuesEnv (retry semantics)', () => {
  it('T-CFQ-008 retries a message when msg.retry() is called', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    let attempt = 0;
    env.registerConsumer<{ id: string }>({
      queue: 'retry-queue',
      maxRetries: 3,
      handler: (batch) => {
        attempt += 1;
        for (const msg of batch.messages) {
          if (attempt < 3) msg.retry();
          else msg.ack();
        }
      },
    });
    await env.send('retry-queue', { id: 'r-1' });
    const snap = await env.assertAcknowledged('retry-queue');
    expect(snap.attempts).toBe(3);
    expect(attempt).toBe(3);
  });

  it('T-CFQ-009 dead-letters after maxRetries exhausted', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'dlq-source',
      maxRetries: 2,
      deadLetterQueue: 'dlq-dead',
      handler: (batch) => {
        for (const msg of batch.messages) msg.retry();
      },
    });
    await env.send('dlq-source', { id: 'd-1' });
    const snap = await env.assertDeadLettered('dlq-source', {
      dlq: 'dlq-dead',
      attempts: 2,
    });
    expect(snap.state).toBe('dead');
    expect(env.listDeadLetters('dlq-dead')).toHaveLength(1);
    expect(env.listDeadLetters('dlq-dead')[0]?.body).toEqual({ id: 'd-1' });
  });

  it('T-CFQ-010 handler throws => every message in the batch retries', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    let attempt = 0;
    env.registerConsumer<{ id: string }>({
      queue: 'throw-queue',
      maxRetries: 3,
      handler: (batch) => {
        attempt += 1;
        if (attempt < 3) throw new Error(`transient failure #${attempt}`);
        // On the third attempt the handler no longer throws and explicitly
        // acks — mirrors a real consumer recovering after transient errors.
        batch.ackAll();
      },
    });
    await env.send('throw-queue', { id: 't-1' });
    const snap = await env.assertAcknowledged('throw-queue');
    expect(snap.attempts).toBe(3);
    expect(snap.failedReason).toBeUndefined();
  });

  it('T-CFQ-011 handler throws until exhaustion => DLQ with failedReason preserved', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'exhaust-queue',
      maxRetries: 2,
      deadLetterQueue: 'exhaust-dlq',
      handler: () => {
        throw new Error('always-broken');
      },
    });
    await env.send('exhaust-queue', { id: 'e-1' });
    const snap = await env.assertDeadLettered('exhaust-queue', {
      dlq: 'exhaust-dlq',
      attempts: 2,
      reasonMatch: /always-broken/,
    });
    expect(snap.failedReason).toBe('always-broken');
  });

  it('T-CFQ-012 unacked message defaults to retry semantics', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    let attempt = 0;
    env.registerConsumer<{ id: string }>({
      queue: 'silent-queue',
      maxRetries: 3,
      handler: () => {
        attempt += 1;
        if (attempt === 3) return; // ack is missing but retry semantics still apply
      },
    });
    await env.send('silent-queue', { id: 's-1' });
    // With no ack the message keeps retrying and eventually dead-letters.
    const snap = await env.assertDeadLettered('silent-queue', { attempts: 3 });
    expect(snap.state).toBe('dead');
    expect(attempt).toBe(3);
  });
});

describe('setupCloudflareQueuesEnv (assertion helpers)', () => {
  it('T-CFQ-013 assertRetried asserts observed attempts', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    let attempt = 0;
    env.registerConsumer<{ id: string }>({
      queue: 'assert-retried',
      maxRetries: 4,
      handler: (batch) => {
        attempt += 1;
        for (const msg of batch.messages) {
          if (attempt < 4) msg.retry();
          else msg.ack();
        }
      },
    });
    await env.send('assert-retried', { id: 'r-1' });
    const snap = await env.assertRetried('assert-retried', 4);
    expect(snap.attempts).toBe(4);
  });

  it('T-CFQ-014 waitForMessage rejects on timeout when nothing terminal happens', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    // No consumer registered — the message stays pending forever.
    await env.send('never-consumed', { id: 'stuck' });
    await expect(
      env.waitForMessage('never-consumed', { timeoutMs: 200 }),
    ).rejects.toThrow(/timeout/);
  });

  it('T-CFQ-015 assertAcknowledged rejects when the observed state is dead', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'bad-ack',
      maxRetries: 1,
      handler: () => {
        throw new Error('permanent');
      },
    });
    await env.send('bad-ack', { id: 'x' });
    await expect(env.assertAcknowledged('bad-ack')).rejects.toThrow(
      /expected message on "bad-ack" to be acked/,
    );
  });

  it('T-CFQ-016 assertDeadLettered rejects when message did not dead-letter', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'good-ack',
      handler: (batch) => batch.ackAll(),
    });
    await env.send('good-ack', { id: 'x' });
    await expect(env.assertDeadLettered('good-ack')).rejects.toThrow(
      /expected message on "good-ack" to be dead-lettered/,
    );
  });

  it('T-CFQ-017 assertQueueDrained without a queue argument drains every queue', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'q-a',
      handler: (batch) => batch.ackAll(),
    });
    env.registerConsumer<{ id: string }>({
      queue: 'q-b',
      handler: (batch) => batch.ackAll(),
    });
    await env.send('q-a', { id: 'a' });
    await env.send('q-b', { id: 'b' });
    await env.assertQueueDrained();
    // Both queues drained — no throw.
    expect(env.listMessages('q-a')[0]?.state).toBe('ack');
    expect(env.listMessages('q-b')[0]?.state).toBe('ack');
  });

  it('T-CFQ-018 assertQueueDrained throws when a message is stuck pending', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    await env.send('stuck-queue', { id: 'x' });
    await expect(env.assertQueueDrained('stuck-queue')).rejects.toThrow(
      /still have pending/,
    );
  });
});

describe('setupCloudflareQueuesEnv (send options)', () => {
  it('T-CFQ-019 rejects negative delaySeconds', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    await expect(env.send('any', {}, { delaySeconds: -1 })).rejects.toThrow(
      /delaySeconds must be non-negative/,
    );
  });

  it('T-CFQ-020 delayed sends fire after visibility window opens', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const t0 = Date.now();
    let observedAt = 0;
    env.registerConsumer<{ id: string }>({
      queue: 'delayed',
      handler: (batch) => {
        observedAt = Date.now();
        batch.ackAll();
      },
    });
    await env.send('delayed', { id: 'd' }, { delaySeconds: 0.1 });
    await env.assertAcknowledged('delayed');
    const elapsed = observedAt - t0;
    // Allow generous slack for slow CI.
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });

  it('T-CFQ-021 rejects empty queue name', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    await expect(env.send('', {})).rejects.toThrow(/non-empty string/);
  });

  it('T-CFQ-021b accepts contentType hint (structural parity)', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'ct-queue',
      handler: (batch) => batch.ackAll(),
    });
    // contentType is accepted for API parity with production but not persisted
    // on the snapshot — the miniflare simulation stores the body as-is.
    await env.send('ct-queue', { id: 'x' }, { contentType: 'json' });
    await env.send('ct-queue', { id: 'y' }, { contentType: 'bytes' });
    await env.assertQueueDrained('ct-queue');
    expect(env.listMessages('ct-queue').every((s) => s.state === 'ack')).toBe(true);
  });
});

describe('setupCloudflareQueuesEnv (consumers)', () => {
  it('T-CFQ-022 registering a duplicate consumer replaces the previous handler', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    let usedFirst = 0;
    let usedSecond = 0;
    env.registerConsumer<{ id: string }>({
      queue: 'dup',
      handler: (batch) => {
        usedFirst += batch.messages.length;
        batch.ackAll();
      },
    });
    env.registerConsumer<{ id: string }>({
      queue: 'dup',
      handler: (batch) => {
        usedSecond += batch.messages.length;
        batch.ackAll();
      },
    });
    await env.send('dup', { id: 'x' });
    await env.assertAcknowledged('dup');
    expect(usedFirst).toBe(0);
    expect(usedSecond).toBe(1);
  });

  it('T-CFQ-023 orphan messages (no consumer) never terminate', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    await env.send('orphan', { id: 'x' });
    const snapshots = env.listMessages('orphan');
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.state).toBe('pending');
  });

  it('T-CFQ-024 registerConsumer rejects an empty queue name', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    expect(() =>
      env.registerConsumer({
        queue: '',
        handler: () => {
          // no-op
        },
      }),
    ).toThrow(/non-empty string/);
  });

  it('T-CFQ-025 maxBatchSize < 1 throws when the scheduler tries to flush', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'invalid-size',
      maxBatchSize: 0,
      handler: (batch) => batch.ackAll(),
    });
    await env.send('invalid-size', { id: 'x' });
    // The scheduler surfaces the error via waitForMessage timeout — we cannot
    // observe the throw directly because it happens in the scheduler tick.
    await expect(
      env.waitForMessage('invalid-size', { timeoutMs: 100 }),
    ).rejects.toThrow(/timeout/);
  });
});

describe('setupCloudflareQueuesEnv (lifecycle)', () => {
  it('T-CFQ-026 stop() prevents further sends and clears state', async () => {
    const env = await setupCloudflareQueuesEnv();
    // Deliberately not pushed to envs — we call stop() ourselves.
    env.registerConsumer<{ id: string }>({
      queue: 'lifecycle',
      handler: (batch) => batch.ackAll(),
    });
    await env.send('lifecycle', { id: 'x' });
    await env.assertAcknowledged('lifecycle');
    await env.stop();
    await expect(env.send('lifecycle', { id: 'y' })).rejects.toThrow(
      /cannot use env after stop/,
    );
  });

  it('T-CFQ-027 listMessages without a queue argument returns every message', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'a',
      handler: (batch) => batch.ackAll(),
    });
    env.registerConsumer<{ id: string }>({
      queue: 'b',
      handler: (batch) => batch.ackAll(),
    });
    await env.send('a', { id: '1' });
    await env.send('b', { id: '2' });
    await env.assertQueueDrained();
    const all = env.listMessages();
    expect(all.map((m) => m.queueName).sort()).toEqual(['a', 'b']);
  });

  it('T-CFQ-028 listDeadLetters without a dlqName returns every DLQ entry', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    env.registerConsumer<{ id: string }>({
      queue: 'src-a',
      maxRetries: 1,
      deadLetterQueue: 'dlq-a',
      handler: () => {
        throw new Error('a');
      },
    });
    env.registerConsumer<{ id: string }>({
      queue: 'src-b',
      maxRetries: 1,
      deadLetterQueue: 'dlq-b',
      handler: () => {
        throw new Error('b');
      },
    });
    await env.send('src-a', { id: '1' });
    await env.send('src-b', { id: '2' });
    await env.assertDeadLettered('src-a');
    await env.assertDeadLettered('src-b');
    const all = env.listDeadLetters();
    expect(all.map((m) => m.queueName).sort()).toEqual(['src-a', 'src-b']);
  });
});

describe('setupCloudflareQueuesEnv (batch API)', () => {
  it('T-CFQ-029 batch.retryAll retries every message', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    let attempt = 0;
    env.registerConsumer<{ n: number }>({
      queue: 'retry-all',
      maxRetries: 3,
      handler: (batch) => {
        attempt += 1;
        if (attempt < 3) batch.retryAll();
        else batch.ackAll();
      },
    });
    await env.send('retry-all', { n: 1 });
    await env.send('retry-all', { n: 2 });
    await env.assertQueueDrained('retry-all');
    const snaps = env.listMessages('retry-all');
    expect(snaps.every((s) => s.state === 'ack')).toBe(true);
    expect(snaps.every((s) => s.attempts === 3)).toBe(true);
  });

  it('T-CFQ-030 retry overrides a subsequent ack on the same message', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    let attempt = 0;
    env.registerConsumer<{ id: string }>({
      queue: 'retry-wins',
      maxRetries: 3,
      handler: (batch) => {
        attempt += 1;
        for (const msg of batch.messages) {
          msg.retry();
          msg.ack(); // ignored — retry() already recorded the decision
        }
      },
    });
    await env.send('retry-wins', { id: 'x' });
    // With retry() always winning, the message hits maxRetries and dies.
    // deadLetterQueue is unset so the message stays dead without being routed.
    const snap = await env.waitForMessage('retry-wins', { timeoutMs: 500 });
    expect(snap.state).toBe('dead');
    expect(attempt).toBe(3);
    expect(env.listDeadLetters()).toHaveLength(0);
  });
});
