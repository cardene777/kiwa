import { afterEach, describe, expect, it } from 'vitest';
import {
  setupCloudflareQueuesEnv,
  type CloudflareQueuesTestEnv,
} from '@kiwa-test/queue';
import {
  attachEdgeAuditPipeline,
  createAuditConsumer,
  createAuditSink,
  type WebhookEvent,
} from '../src/edge-notification-pipeline.js';

const envs: CloudflareQueuesTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('Cloudflare Queues PoC — edge audit pipeline (miniflare happy path)', () => {
  it('T-CFQ-POC-001 delivers a single webhook event to the audit sink', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const sink = attachEdgeAuditPipeline(env);
    await env.send<WebhookEvent>('webhook-events', {
      eventId: 'e-1',
      actor: 'alice',
      kind: 'created',
    });
    const snap = await env.assertAcknowledged<WebhookEvent>('webhook-events');
    expect(snap.state).toBe('ack');
    expect(snap.attempts).toBe(1);
    expect(sink.entries).toEqual([
      { eventId: 'e-1', actor: 'alice', kind: 'created' },
    ]);
  });

  it('T-CFQ-POC-002 batches multiple webhook events into a single consumer invocation', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const sink = attachEdgeAuditPipeline(env);
    await Promise.all(
      (['created', 'updated', 'deleted'] as const).map((kind, idx) =>
        env.send<WebhookEvent>('webhook-events', {
          eventId: `e-${idx + 1}`,
          actor: `actor-${idx + 1}`,
          kind,
        }),
      ),
    );
    await env.assertQueueDrained('webhook-events');
    expect(sink.entries.map((e) => e.kind)).toEqual([
      'created',
      'updated',
      'deleted',
    ]);
  });
});

describe('Cloudflare Queues PoC — retry semantics', () => {
  it('T-CFQ-POC-003 recovers after transient audit-sink failures', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const sink = attachEdgeAuditPipeline(env, {
      transientFailures: 2,
      maxRetries: 3,
    });
    await env.send<WebhookEvent>('webhook-events', {
      eventId: 'e-flaky',
      actor: 'bob',
      kind: 'updated',
    });
    const snap = await env.assertAcknowledged<WebhookEvent>('webhook-events');
    expect(snap.attempts).toBe(3);
    expect(sink.entries).toHaveLength(1);
    expect(sink.entries[0]?.eventId).toBe('e-flaky');
    expect(sink.transientFailuresRemaining).toBe(0);
  });

  it('T-CFQ-POC-004 dead-letters when retries are exhausted', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const sink = attachEdgeAuditPipeline(env, {
      hardFailureFor: ['e-broken'],
      maxRetries: 2,
      deadLetterQueue: 'audit-dlq',
    });
    await env.send<WebhookEvent>('webhook-events', {
      eventId: 'e-broken',
      actor: 'carol',
      kind: 'deleted',
    });
    // The consumer catches the sink's throw internally and calls `msg.retry()`
    // so `failedReason` is not surfaced — matches production Cloudflare Queues
    // where the runtime only records a reason when the handler itself throws.
    const snap = await env.assertDeadLettered<WebhookEvent>('webhook-events', {
      dlq: 'audit-dlq',
      attempts: 2,
    });
    expect(snap.state).toBe('dead');
    expect(sink.entries).toHaveLength(0);
    const dlq = env.listDeadLetters('audit-dlq');
    expect(dlq).toHaveLength(1);
    expect(dlq[0]?.body).toEqual({
      eventId: 'e-broken',
      actor: 'carol',
      kind: 'deleted',
    });
  });
});

describe('Cloudflare Queues PoC — mixed batch (partial success)', () => {
  it('T-CFQ-POC-005 acks the healthy events while retrying the broken one', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    const sink = attachEdgeAuditPipeline(env, {
      hardFailureFor: ['e-broken'],
      maxRetries: 2,
      deadLetterQueue: 'audit-dlq',
    });
    // Send two healthy events + one hard-failure event in the same batch — the
    // consumer partial-acks so the healthy events terminate on the first pass
    // while the broken one goes on to DLQ.
    await env.send<WebhookEvent>('webhook-events', {
      eventId: 'e-broken',
      actor: 'alice',
      kind: 'created',
    });
    await env.send<WebhookEvent>('webhook-events', {
      eventId: 'e-ok-1',
      actor: 'bob',
      kind: 'updated',
    });
    await env.send<WebhookEvent>('webhook-events', {
      eventId: 'e-ok-2',
      actor: 'carol',
      kind: 'deleted',
    });
    await env.assertQueueDrained('webhook-events');
    expect(sink.entries.map((e) => e.eventId).sort()).toEqual([
      'e-ok-1',
      'e-ok-2',
    ]);
    expect(env.listDeadLetters('audit-dlq').map((m) => (m.body as WebhookEvent).eventId)).toEqual([
      'e-broken',
    ]);
  });
});

describe('Cloudflare Queues PoC — orphans + edge cases', () => {
  it('T-CFQ-POC-006 orphan messages (no consumer) stay pending until stop()', async () => {
    const env = await setupCloudflareQueuesEnv({ queues: ['orphan-events'] });
    envs.push(env);
    await env.send<WebhookEvent>('orphan-events', {
      eventId: 'e-orphan',
      actor: 'dave',
      kind: 'updated',
    });
    // No consumer for `orphan-events` — waitForMessage times out and the
    // message stays visible in listMessages.
    await expect(
      env.waitForMessage('orphan-events', { timeoutMs: 150 }),
    ).rejects.toThrow(/timeout/);
    const [orphan] = env.listMessages('orphan-events');
    expect(orphan?.state).toBe('pending');
  });

  it('T-CFQ-POC-007 stop() clears sink invocations from lingering timers', async () => {
    const env = await setupCloudflareQueuesEnv();
    const sink = createAuditSink();
    env.registerConsumer(createAuditConsumer(sink));
    await env.send<WebhookEvent>('webhook-events', {
      eventId: 'e-clean',
      actor: 'eve',
      kind: 'created',
    });
    await env.assertAcknowledged('webhook-events');
    await env.stop();
    // A post-stop send raises rather than silently enqueuing — matches
    // Cloudflare Queues env parity where a closed binding is unusable.
    await expect(
      env.send<WebhookEvent>('webhook-events', {
        eventId: 'e-late',
        actor: 'eve',
        kind: 'updated',
      }),
    ).rejects.toThrow(/cannot use env after stop/);
    // The sink still records the single pre-stop entry — no ghost writes.
    expect(sink.entries.map((e) => e.eventId)).toEqual(['e-clean']);
  });

  it('T-CFQ-POC-008 waitForMessage rejects on timeout when the sink is slow / blocked', async () => {
    const env = await setupCloudflareQueuesEnv();
    envs.push(env);
    // Slow sink — the consumer takes >200ms per batch so the assertion
    // deadline elapses before terminal state.
    env.registerConsumer<WebhookEvent>({
      queue: 'slow-events',
      handler: async (batch) => {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 250);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
        batch.ackAll();
      },
    });
    await env.send<WebhookEvent>('slow-events', {
      eventId: 'e-slow',
      actor: 'frank',
      kind: 'updated',
    });
    await expect(
      env.waitForMessage('slow-events', { timeoutMs: 100 }),
    ).rejects.toThrow(/timeout/);
    // Give the slow handler a moment to finish so afterEach cleanup is
    // graceful — otherwise env.stop clears state mid-handler.
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 300);
      (timer as unknown as { unref?: () => void }).unref?.();
    });
  });
});
