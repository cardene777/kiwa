import {
  setupRabbitMQAdvancedEnv,
  type RabbitMQAdvancedTestEnv,
} from '@kiwa/queue';
import type {
  AutoReconnectOutcome,
  FederationIngestResult,
  OrderMessage,
  QueueAdapter,
  QueueDepthSnapshot,
  RetryOutcome,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — drives one advanced RabbitMQ env that hosts every topology
 * the worker uses: DLX pipeline, delayed exchange, quorum queue, federation
 * upstream + link. Trace events mirror the shape the real adapter records
 * so fidelity comparison is 1:1.
 */
export async function makeMockAdapter(): Promise<QueueAdapter> {
  const env: RabbitMQAdvancedTestEnv<'mock'> = await setupRabbitMQAdvancedEnv({
    cluster: {
      nodes: [
        { id: 'rabbit@node-1', role: 'primary', active: true },
        { id: 'rabbit@node-2', role: 'replica', active: true },
        { id: 'rabbit@node-3', role: 'replica', active: true },
      ],
    },
    federation: {
      upstreams: [{ name: 'upstream-eu', uri: 'amqp://eu-broker:5672' }],
      links: [{ upstreamName: 'upstream-eu', downstreamExchange: 'dlx.work' }],
    },
    autoReconnect: {
      initialDelayMs: 100,
      maxDelayMs: 1000,
      factor: 2,
      maxAttempts: 10,
    },
  });
  const trace: TraceEvent[] = [];

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function declareTopology(): Promise<void> {
    await env.declareExchange({ name: 'dlx.work', type: 'direct' });
    await env.delayed.declareDelayedExchange({
      name: 'sms.delayed',
      type: 'x-delayed-message',
      delayedType: 'direct',
    });
    await env.declareQueue({
      name: 'work.main',
      deadLetterExchange: 'dlx.work',
      deadLetterRoutingKey: 'work.failed',
      kind: 'quorum',
    });
    await env.declareQueue({ name: 'work.triage' });
    await env.declareQueue({ name: 'sms.outbox' });
    await env.bindQueue({
      exchange: 'dlx.work',
      queue: 'work.triage',
      routingKey: 'work.failed',
    });
    await env.bindQueue({
      exchange: 'sms.delayed',
      queue: 'sms.outbox',
      routingKey: 'sms.reminder',
    });
    record('declareTopology', true);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    declareTopology,

    async processOrder(order: OrderMessage): Promise<QueueDepthSnapshot> {
      await env.consume({
        queue: 'work.main',
        handler: (msg) => {
          const body = msg.body as { valid: boolean };
          if (!body.valid) msg.nack({ requeue: false });
          else msg.ack();
        },
      });
      await env.sendToQueue({ queue: 'work.main', body: order });
      // Allow the consumer + DLX routing to settle.
      await new Promise((r) => setTimeout(r, 20));
      const snap: QueueDepthSnapshot = {
        main: env.peek('work.main').filter((m) => m.state === 'ready').length,
        triage: env.peek('work.triage').length,
        outbox: env.peek('sms.outbox').length,
      };
      record('processOrder', true, { detail: { valid: order.valid, snap } });
      return snap;
    },

    async scheduleDelayedReminder(input): Promise<{ delivered: boolean; outboxDepthAfter: number }> {
      await env.delayed.publishDelayed({
        exchange: 'sms.delayed',
        routingKey: 'sms.reminder',
        body: { phone: input.phone, text: input.text },
        delayMs: input.delayMs,
      });
      await env.delayed.advanceClock(input.delayMs + 5);
      const depth = env.peek('sms.outbox').length;
      record('scheduleDelayedReminder', true, { detail: { depth } });
      return { delivered: depth >= 1, outboxDepthAfter: depth };
    },

    async processRetryPolicy(input): Promise<RetryOutcome> {
      let attempts = 0;
      let acked = false;
      await env.consume({
        queue: 'work.main',
        handler: (msg) => {
          attempts += 1;
          if (attempts <= input.failuresBeforeSuccess) {
            msg.nack({ requeue: true });
          } else {
            msg.ack();
            acked = true;
          }
        },
      });
      await env.sendToQueue({ queue: 'work.main', body: 'retry-me' });
      // Poll until either an ack happens or the timeout elapses. The
      // advanced env's requeue path dispatches asynchronously so an
      // unbounded loop would hang; capping at 500ms is safe here.
      const start = Date.now();
      while (Date.now() - start < 500) {
        if (acked) break;
        await new Promise((r) => setTimeout(r, 5));
      }
      record('processRetryPolicy', true, { detail: { attempts, acked } });
      return {
        finalDeliveryCount: attempts,
        eventuallySucceeded: acked,
      };
    },

    async verifyQuorumSurvival(input): Promise<{ survived: boolean }> {
      await env.cluster.stopNode(input.failNodeId);
      try {
        env.cluster.assertQuorumHealthy('work.main', { minReplicas: 2 });
        record('verifyQuorumSurvival', true);
        return { survived: true };
      } catch (err) {
        record('verifyQuorumSurvival', false, { errorKind: (err as Error).message });
        return { survived: false };
      }
    },

    async ingestFromFederationUpstream(input): Promise<FederationIngestResult> {
      await env.federation.ingestFromUpstream({
        upstreamName: input.upstreamName,
        exchange: input.exchange,
        routingKey: input.routingKey,
        body: input.body,
      });
      const depth = env.peek('work.triage').length;
      record('ingestFromFederationUpstream', true, { detail: { depth } });
      return {
        fromUpstream: input.upstreamName,
        landedOnQueue: 'work.triage',
        depthAfter: depth,
      };
    },

    async simulateReconnect(input): Promise<AutoReconnectOutcome> {
      const out = await env.autoReconnect.simulateReconnect({
        failAttempts: input.failAttempts,
      });
      record('simulateReconnect', out.succeeded, { detail: out });
      return out;
    },

    async reset(): Promise<void> {
      await env.stop();
      trace.length = 0;
    },
  };
}
