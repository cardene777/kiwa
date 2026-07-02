import { randomUUID } from 'node:crypto';
import { createStubRabbitMQEnv } from '../rabbitmq/stub-rabbitmq.js';
import type {
  RabbitMQBindingSpec,
  RabbitMQMessageSnapshot,
  RabbitMQPublishOptions,
  RabbitMQTestEnv,
} from '../rabbitmq/types.js';
import type {
  RabbitMQAdvancedQueueSpec,
  RabbitMQAdvancedTestEnv,
  RabbitMQClusterNode,
  RabbitMQDeadLetterSnapshot,
  RabbitMQDelayedExchangeSpec,
  RabbitMQDelayedMessageSnapshot,
  RabbitMQFederationLink,
  RabbitMQFederationUpstream,
  SetupRabbitMQAdvancedEnvOptions,
} from './types.js';

const DEFAULT_AUTO_RECONNECT = {
  initialDelayMs: 100,
  maxDelayMs: 1000,
  factor: 2,
  maxAttempts: 10,
};

interface QueueTopology {
  spec: RabbitMQAdvancedQueueSpec;
  createdAt: number;
}

/**
 * Build the advanced RabbitMQ test env. Composes over the basic stub adapter
 * (v1.10-3) — the basic env owns exchange / queue / binding / consumer
 * bookkeeping, while this env layers DLX routing, delayed message plugin,
 * cluster simulation, federation, and auto-reconnect.
 */
export async function setupRabbitMQAdvancedEnv(
  opts: SetupRabbitMQAdvancedEnvOptions = {},
): Promise<RabbitMQAdvancedTestEnv<'mock'>> {
  const inner: RabbitMQTestEnv<'mock'> = createStubRabbitMQEnv({});

  const queueTopology = new Map<string, QueueTopology>();
  const deadLetters: RabbitMQDeadLetterSnapshot[] = [];
  const delayedExchanges = new Map<string, RabbitMQDelayedExchangeSpec>();
  const pendingDelayed: Array<RabbitMQDelayedMessageSnapshot & { deliverAt: number }> = [];
  const clusterNodes = new Map<string, RabbitMQClusterNode>();
  const upstreams = new Map<string, RabbitMQFederationUpstream>();
  const federationLinks: RabbitMQFederationLink[] = [];
  const autoReconnect = {
    initialDelayMs: opts.autoReconnect?.initialDelayMs ?? DEFAULT_AUTO_RECONNECT.initialDelayMs,
    maxDelayMs: opts.autoReconnect?.maxDelayMs ?? DEFAULT_AUTO_RECONNECT.maxDelayMs,
    factor: opts.autoReconnect?.factor ?? DEFAULT_AUTO_RECONNECT.factor,
    maxAttempts: opts.autoReconnect?.maxAttempts ?? DEFAULT_AUTO_RECONNECT.maxAttempts,
  };
  let clockOffsetMs = 0;
  let nodeRoundRobin = 0;

  function now(): number {
    return Date.now() + clockOffsetMs;
  }

  async function declareAdvancedQueue(spec: RabbitMQAdvancedQueueSpec): Promise<void> {
    await inner.declareQueue(spec);
    queueTopology.set(spec.name, { spec, createdAt: now() });
  }

  async function dispatchDeadLetter<TBody>(input: {
    queueSpec: RabbitMQAdvancedQueueSpec;
    body: TBody;
    originalMessageId: string;
    reason: RabbitMQDeadLetterSnapshot['reason'];
    deliveryCount: number;
    originalRoutingKey: string;
  }): Promise<void> {
    const dlx = input.queueSpec.deadLetterExchange;
    if (!dlx) return;
    const dlrk = input.queueSpec.deadLetterRoutingKey ?? input.originalRoutingKey;
    await inner.publish({
      exchange: dlx,
      routingKey: dlrk,
      body: input.body,
    });
    const snap: RabbitMQDeadLetterSnapshot<TBody> = {
      originalMessageId: input.originalMessageId,
      originalQueue: input.queueSpec.name,
      deadLetterExchange: dlx,
      deadLetterRoutingKey: dlrk,
      reason: input.reason,
      body: input.body,
      deliveryCount: input.deliveryCount,
      timestamp: now(),
    };
    deadLetters.push(snap as RabbitMQDeadLetterSnapshot);
  }

  // Seed topology from options.
  for (const spec of opts.exchanges ?? []) await inner.declareExchange(spec);
  for (const spec of opts.delayedExchanges ?? []) {
    delayedExchanges.set(spec.name, spec);
    // Materialize as a regular exchange so bindings resolve normally on
    // delivery. The `delayedType` drives the resolution logic when the
    // delay elapses.
    await inner.declareExchange({
      name: spec.name,
      type: spec.delayedType ?? 'direct',
    });
  }
  for (const spec of opts.queues ?? []) await declareAdvancedQueue(spec);
  for (const spec of opts.bindings ?? []) await inner.bindQueue(spec);
  for (const node of opts.cluster?.nodes ?? []) clusterNodes.set(node.id, { ...node });
  for (const up of opts.federation?.upstreams ?? []) upstreams.set(up.name, { ...up });
  for (const link of opts.federation?.links ?? []) federationLinks.push({ ...link });

  const env: RabbitMQAdvancedTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'stub',

    declareExchange: (spec) => inner.declareExchange(spec),
    declareQueue: (spec) => declareAdvancedQueue(spec),
    bindQueue: (spec) => inner.bindQueue(spec),
    unbindQueue: (spec) => inner.unbindQueue(spec),

    publish: (async <TBody = unknown>(input: {
      exchange: string;
      routingKey: string;
      body: TBody;
      options?: RabbitMQPublishOptions;
    }): Promise<RabbitMQMessageSnapshot<TBody>> => {
      return inner.publish<TBody>(input);
    }) as RabbitMQAdvancedTestEnv<'mock'>['publish'],

    sendToQueue: (async <TBody = unknown>(input: {
      queue: string;
      body: TBody;
      options?: RabbitMQPublishOptions;
    }): Promise<RabbitMQMessageSnapshot<TBody>> => {
      return inner.sendToQueue<TBody>(input);
    }) as RabbitMQAdvancedTestEnv<'mock'>['sendToQueue'],

    peek: (<TBody = unknown>(queueName: string): RabbitMQMessageSnapshot<TBody>[] => {
      return inner.peek<TBody>(queueName);
    }) as RabbitMQAdvancedTestEnv<'mock'>['peek'],

    get: ((input) => inner.get(input)) as RabbitMQAdvancedTestEnv<'mock'>['get'],

    consume: (async <TBody = unknown>(input: {
      queue: string;
      handler: Parameters<RabbitMQTestEnv<'mock'>['consume']>[0]['handler'];
      options?: Parameters<RabbitMQTestEnv<'mock'>['consume']>[0]['options'];
    }) => {
      const spec = queueTopology.get(input.queue)?.spec;
      const rawHandler = input.handler;
      const wrappedHandler: typeof rawHandler = (delivery) => {
        // Wrap `nack` to route to DLX on `requeue=false`.
        const originalNack = delivery.nack;
        delivery.nack = (nackOpts) => {
          const requeue = nackOpts?.requeue ?? false;
          originalNack(nackOpts);
          if (!requeue && spec?.deadLetterExchange) {
            void dispatchDeadLetter({
              queueSpec: spec,
              body: delivery.body,
              originalMessageId: delivery.messageId,
              reason: 'rejected',
              deliveryCount: delivery.deliveryCount,
              originalRoutingKey: delivery.routingKey,
            });
          } else if (!requeue && spec?.maxDeliveries !== undefined && delivery.deliveryCount >= spec.maxDeliveries) {
            void dispatchDeadLetter({
              queueSpec: spec,
              body: delivery.body,
              originalMessageId: delivery.messageId,
              reason: 'delivery-limit',
              deliveryCount: delivery.deliveryCount,
              originalRoutingKey: delivery.routingKey,
            });
          }
        };
        return rawHandler(delivery);
      };
      if (input.options !== undefined) {
        return inner.consume({
          queue: input.queue,
          handler: wrappedHandler,
          options: input.options,
        });
      }
      return inner.consume({ queue: input.queue, handler: wrappedHandler });
    }) as RabbitMQAdvancedTestEnv<'mock'>['consume'],

    dlx: {
      listDeadLetters: (<TBody = unknown>() =>
        deadLetters.map((d) => ({ ...d })) as RabbitMQDeadLetterSnapshot<TBody>[]) as RabbitMQAdvancedTestEnv<'mock'>['dlx']['listDeadLetters'],
      assertDeadLettered: (async <TBody = unknown>(
        queue: string,
        expected?: {
          reason?: RabbitMQDeadLetterSnapshot['reason'];
          deadLetterExchange?: string;
        },
      ): Promise<RabbitMQDeadLetterSnapshot<TBody>> => {
        const start = Date.now();
        while (Date.now() - start < 2000) {
          const hit = deadLetters
            .filter((d) => d.originalQueue === queue)
            .filter((d) => !expected?.reason || d.reason === expected.reason)
            .filter((d) => !expected?.deadLetterExchange || d.deadLetterExchange === expected.deadLetterExchange);
          if (hit.length > 0) return hit[hit.length - 1]! as RabbitMQDeadLetterSnapshot<TBody>;
          await new Promise((r) => setTimeout(r, 10));
        }
        throw new Error(
          `assertDeadLettered: no dead-letter observed for queue ${queue}` +
            (expected ? ` matching ${JSON.stringify(expected)}` : ''),
        );
      }) as RabbitMQAdvancedTestEnv<'mock'>['dlx']['assertDeadLettered'],
    },

    delayed: {
      async declareDelayedExchange(spec) {
        delayedExchanges.set(spec.name, spec);
        await inner.declareExchange({
          name: spec.name,
          type: spec.delayedType ?? 'direct',
        });
      },
      publishDelayed: (async <TBody = unknown>(input: {
        exchange: string;
        routingKey: string;
        body: TBody;
        delayMs: number;
        options?: RabbitMQPublishOptions;
      }): Promise<RabbitMQDelayedMessageSnapshot<TBody>> => {
        if (!delayedExchanges.has(input.exchange)) {
          throw new Error(
            `publishDelayed: exchange ${input.exchange} is not a delayed exchange`,
          );
        }
        if (input.delayMs < 0) {
          throw new Error('publishDelayed: delayMs must be non-negative');
        }
        const snap: RabbitMQDelayedMessageSnapshot<TBody> = {
          messageId: input.options?.messageId ?? randomUUID(),
          exchange: input.exchange,
          routingKey: input.routingKey,
          body: input.body,
          delayMs: input.delayMs,
          scheduledAt: now(),
          delivered: false,
        };
        pendingDelayed.push({
          ...(snap as RabbitMQDelayedMessageSnapshot),
          deliverAt: now() + input.delayMs,
        });
        return snap;
      }) as RabbitMQAdvancedTestEnv<'mock'>['delayed']['publishDelayed'],
      waitForDelivery: (async <TBody = unknown>(
        exchange: string,
        opts?: { timeoutMs?: number },
      ): Promise<RabbitMQMessageSnapshot<TBody>> => {
        const timeoutMs = opts?.timeoutMs ?? 5000;
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          const due = pendingDelayed.filter(
            (p) => p.exchange === exchange && !p.delivered && p.deliverAt <= now(),
          );
          for (const p of due) {
            await inner.publish({
              exchange: p.exchange,
              routingKey: p.routingKey,
              body: p.body,
              options: { messageId: p.messageId },
            });
            p.delivered = true;
          }
          const published = inner.listPublished<TBody>().filter((m) => m.exchange === exchange);
          if (published.length > 0) return published[published.length - 1]!;
          await new Promise((r) => setTimeout(r, 10));
        }
        throw new Error(
          `waitForDelivery: no delayed message delivered to ${exchange} within ${timeoutMs}ms`,
        );
      }) as RabbitMQAdvancedTestEnv<'mock'>['delayed']['waitForDelivery'],
      async advanceClock(ms) {
        clockOffsetMs += ms;
        // Fire any due messages synchronously.
        const due = pendingDelayed.filter((p) => !p.delivered && p.deliverAt <= now());
        for (const p of due) {
          await inner.publish({
            exchange: p.exchange,
            routingKey: p.routingKey,
            body: p.body,
            options: { messageId: p.messageId },
          });
          p.delivered = true;
        }
      },
      listPending: (<TBody = unknown>() =>
        pendingDelayed
          .filter((p) => !p.delivered)
          .map((p) => ({
            messageId: p.messageId,
            exchange: p.exchange,
            routingKey: p.routingKey,
            body: p.body,
            delayMs: p.delayMs,
            scheduledAt: p.scheduledAt,
            delivered: p.delivered,
          })) as RabbitMQDelayedMessageSnapshot<TBody>[]) as RabbitMQAdvancedTestEnv<'mock'>['delayed']['listPending'],
    },

    cluster: {
      listNodes() {
        return Array.from(clusterNodes.values()).map((n) => ({ ...n }));
      },
      async stopNode(id) {
        const node = clusterNodes.get(id);
        if (!node) throw new Error(`stopNode: node ${id} not registered`);
        node.active = false;
        clusterNodes.set(id, node);
      },
      async startNode(id) {
        const node = clusterNodes.get(id);
        if (!node) throw new Error(`startNode: node ${id} not registered`);
        node.active = true;
        clusterNodes.set(id, node);
      },
      resolveQueueNode(queueName) {
        const active = Array.from(clusterNodes.values()).filter((n) => n.active);
        if (active.length === 0) return null;
        // Deterministic — hash queue name to pick a node.
        const idx = queueName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % active.length;
        return active[idx]!.id;
      },
      assertQuorumHealthy(queueName, opts) {
        const topology = queueTopology.get(queueName);
        if (!topology) {
          throw new Error(`assertQuorumHealthy: queue ${queueName} not declared`);
        }
        if (topology.spec.kind !== 'quorum') {
          throw new Error(`assertQuorumHealthy: queue ${queueName} is not a quorum queue`);
        }
        const activeCount = Array.from(clusterNodes.values()).filter((n) => n.active).length;
        const min = opts?.minReplicas ?? 3;
        if (activeCount < min) {
          throw new Error(
            `assertQuorumHealthy: queue ${queueName} requires ${min} active nodes, only ${activeCount} available`,
          );
        }
      },
    },

    federation: {
      listUpstreams() {
        return Array.from(upstreams.values()).map((u) => ({ ...u }));
      },
      listLinks() {
        return federationLinks.map((l) => ({ ...l }));
      },
      ingestFromUpstream: (async <TBody = unknown>(input: {
        upstreamName: string;
        exchange: string;
        routingKey: string;
        body: TBody;
      }): Promise<RabbitMQMessageSnapshot<TBody>> => {
        if (!upstreams.has(input.upstreamName)) {
          throw new Error(`ingestFromUpstream: upstream ${input.upstreamName} not registered`);
        }
        // Only ingest if there is a matching link — mimics real federation.
        const link = federationLinks.find(
          (l) =>
            l.upstreamName === input.upstreamName &&
            (l.downstreamExchange === input.exchange || l.downstreamQueue !== undefined),
        );
        if (!link) {
          throw new Error(
            `ingestFromUpstream: no federation link for upstream ${input.upstreamName} → ${input.exchange}`,
          );
        }
        if (link.downstreamExchange) {
          return inner.publish<TBody>({
            exchange: link.downstreamExchange,
            routingKey: input.routingKey,
            body: input.body,
          });
        }
        return inner.sendToQueue<TBody>({
          queue: link.downstreamQueue!,
          body: input.body,
        });
      }) as RabbitMQAdvancedTestEnv<'mock'>['federation']['ingestFromUpstream'],
    },

    autoReconnect: {
      async simulateReconnect(input) {
        let attempts = 0;
        let delay = autoReconnect.initialDelayMs;
        let totalDelayMs = 0;
        let succeeded = false;
        while (attempts < autoReconnect.maxAttempts) {
          attempts += 1;
          if (attempts > input.failAttempts) {
            succeeded = true;
            break;
          }
          totalDelayMs += delay;
          delay = Math.min(delay * autoReconnect.factor, autoReconnect.maxDelayMs);
        }
        return { attempts, totalDelayMs, succeeded };
      },
      getConfig() {
        return { ...autoReconnect };
      },
    },

    async reset() {
      await inner.reset();
      queueTopology.clear();
      deadLetters.length = 0;
      delayedExchanges.clear();
      pendingDelayed.length = 0;
      clusterNodes.clear();
      upstreams.clear();
      federationLinks.length = 0;
      clockOffsetMs = 0;
      nodeRoundRobin = 0;
    },

    async stop() {
      await env.reset();
    },
  };

  // Silence unused-var warning from generic scaffolding.
  void nodeRoundRobin;
  void ((_binding: RabbitMQBindingSpec) => {});

  return env;
}
