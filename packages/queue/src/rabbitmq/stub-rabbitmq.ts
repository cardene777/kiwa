import { randomUUID } from 'node:crypto';
import type {
  RabbitMQBindingSpec,
  RabbitMQConsumeOptions,
  RabbitMQConsumer,
  RabbitMQDelivery,
  RabbitMQExchangeSpec,
  RabbitMQExchangeType,
  RabbitMQMessageSnapshot,
  RabbitMQMessageState,
  RabbitMQPublishOptions,
  RabbitMQQueueSpec,
  RabbitMQTestEnv,
  SetupRabbitMQEnvOptions,
} from './types.js';

interface StubMessage<TBody = unknown> {
  messageId: string;
  queueName: string;
  exchange: string;
  routingKey: string;
  body: TBody;
  headers: Record<string, unknown>;
  deliveryCount: number;
  state: RabbitMQMessageState;
  failedReason?: string | undefined;
  persistent: boolean;
  enqueuedAt: number;
  deliveryTag?: string | undefined;
  expiresAt?: number | undefined;
  priority: number;
}

interface StubExchange extends RabbitMQExchangeSpec {
  durable: boolean;
  autoDelete: boolean;
  internal: boolean;
}

interface StubQueue extends RabbitMQQueueSpec {
  durable: boolean;
  autoDelete: boolean;
  exclusive: boolean;
}

interface StubConsumer<TBody = unknown> {
  consumerTag: string;
  queueName: string;
  handler: (delivery: RabbitMQDelivery<TBody>) => void | Promise<void>;
  options: Required<Pick<RabbitMQConsumeOptions, 'noAck'>> &
    RabbitMQConsumeOptions;
  cancelled: boolean;
  received: StubMessage<TBody>[];
}

function toSnapshot<TBody>(m: StubMessage<TBody>): RabbitMQMessageSnapshot<TBody> {
  const snap: RabbitMQMessageSnapshot<TBody> = {
    messageId: m.messageId,
    queueName: m.queueName,
    exchange: m.exchange,
    routingKey: m.routingKey,
    body: m.body,
    headers: m.headers,
    deliveryCount: m.deliveryCount,
    state: m.state,
    persistent: m.persistent,
    enqueuedAt: m.enqueuedAt,
  };
  if (m.failedReason !== undefined) snap.failedReason = m.failedReason;
  return snap;
}

/**
 * Match a `topic` routing key against a binding pattern.
 * Word separator is `.`, `*` matches exactly one word, `#` matches zero or more.
 */
function topicMatches(pattern: string, routingKey: string): boolean {
  const p = pattern.split('.');
  const k = routingKey.split('.');
  return matchWords(p, k, 0, 0);
}

function matchWords(p: string[], k: string[], pi: number, ki: number): boolean {
  if (pi === p.length) return ki === k.length;
  const cur = p[pi];
  if (cur === '#') {
    if (pi === p.length - 1) return true;
    for (let i = ki; i <= k.length; i++) {
      if (matchWords(p, k, pi + 1, i)) return true;
    }
    return false;
  }
  if (ki === k.length) return false;
  if (cur === '*' || cur === k[ki]) {
    return matchWords(p, k, pi + 1, ki + 1);
  }
  return false;
}

function headersMatch(
  pattern: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const xMatch = (pattern['x-match'] as string) ?? 'all';
  const entries = Object.entries(pattern).filter(([k]) => k !== 'x-match');
  if (entries.length === 0) return true;
  if (xMatch === 'any') {
    return entries.some(([k, v]) => incoming[k] === v);
  }
  return entries.every(([k, v]) => incoming[k] === v);
}

/**
 * Build the stub RabbitMQ env — in-process, deterministic AMQP 0.9.1 model
 * emulation. No docker required.
 */
export function createStubRabbitMQEnv(
  opts: SetupRabbitMQEnvOptions = {},
): RabbitMQTestEnv<'mock'> {
  const exchanges = new Map<string, StubExchange>();
  const queues = new Map<string, StubQueue>();
  const bindings: RabbitMQBindingSpec[] = [];
  const messages = new Map<string, StubMessage[]>(); // queueName → messages
  const consumers = new Map<string, StubConsumer[]>(); // queueName → consumers
  const published: StubMessage[] = [];
  const returned: StubMessage[] = [];
  let deliveryTagCounter = 0;

  function ensureExchange(spec: RabbitMQExchangeSpec): StubExchange {
    const existing = exchanges.get(spec.name);
    if (existing) {
      if (existing.type !== spec.type) {
        throw new Error(
          `stub-rabbitmq: exchange ${spec.name} already declared with type ${existing.type}, cannot redeclare as ${spec.type}`,
        );
      }
      return existing;
    }
    const ex: StubExchange = {
      name: spec.name,
      type: spec.type,
      durable: spec.durable ?? true,
      autoDelete: spec.autoDelete ?? false,
      internal: spec.internal ?? false,
    };
    if (spec.args !== undefined) ex.args = spec.args;
    exchanges.set(spec.name, ex);
    return ex;
  }

  function ensureQueue(spec: RabbitMQQueueSpec): StubQueue {
    const existing = queues.get(spec.name);
    if (existing) return existing;
    const q: StubQueue = {
      name: spec.name,
      durable: spec.durable ?? true,
      autoDelete: spec.autoDelete ?? false,
      exclusive: spec.exclusive ?? false,
    };
    if (spec.maxLength !== undefined) q.maxLength = spec.maxLength;
    if (spec.args !== undefined) q.args = spec.args;
    queues.set(spec.name, q);
    if (!messages.has(spec.name)) messages.set(spec.name, []);
    return q;
  }

  function enqueue<TBody>(queueName: string, msg: StubMessage<TBody>): void {
    const list = messages.get(queueName);
    if (!list) throw new Error(`stub-rabbitmq: queue ${queueName} not declared`);
    list.push(msg as StubMessage);
    dispatchToConsumers(queueName);
  }

  function routeToQueues(
    exchangeName: string,
    routingKey: string,
    headers: Record<string, unknown>,
  ): string[] {
    if (exchangeName === '') {
      // Default exchange: route directly by queue name.
      if (queues.has(routingKey)) return [routingKey];
      return [];
    }
    const ex = exchanges.get(exchangeName);
    if (!ex) throw new Error(`stub-rabbitmq: exchange ${exchangeName} not declared`);
    const matched = new Set<string>();
    for (const b of bindings) {
      if (b.exchange !== exchangeName) continue;
      if (!queues.has(b.queue)) continue;
      switch (ex.type) {
        case 'direct':
          if (b.routingKey === routingKey) matched.add(b.queue);
          break;
        case 'fanout':
          matched.add(b.queue);
          break;
        case 'topic':
          if (topicMatches(b.routingKey, routingKey)) matched.add(b.queue);
          break;
        case 'headers':
          if (b.args && headersMatch(b.args, headers)) matched.add(b.queue);
          break;
      }
    }
    return Array.from(matched);
  }

  function makeMessage<TBody>(input: {
    body: TBody;
    exchange: string;
    routingKey: string;
    queueName: string;
    options: RabbitMQPublishOptions | undefined;
  }): StubMessage<TBody> {
    const now = Date.now();
    const opts = input.options ?? {};
    const msg: StubMessage<TBody> = {
      messageId: opts.messageId ?? randomUUID(),
      queueName: input.queueName,
      exchange: input.exchange,
      routingKey: input.routingKey,
      body: input.body,
      headers: opts.headers ?? {},
      deliveryCount: 0,
      state: 'ready',
      persistent: opts.persistent ?? false,
      enqueuedAt: now,
      priority: opts.priority ?? 0,
    };
    if (opts.expirationMs !== undefined) msg.expiresAt = now + opts.expirationMs;
    return msg;
  }

  function popNextReadyMessage(queueName: string): StubMessage | null {
    const list = messages.get(queueName);
    if (!list) return null;
    const now = Date.now();
    // Filter out expired messages.
    for (let i = 0; i < list.length; i++) {
      const m = list[i]!;
      if (m.state !== 'ready') continue;
      if (m.expiresAt !== undefined && m.expiresAt < now) {
        m.state = 'dead';
        m.failedReason = 'expired';
        continue;
      }
      // Deliver — flip to unacked, assign delivery tag.
      m.deliveryCount += 1;
      m.state = 'unacked';
      deliveryTagCounter += 1;
      m.deliveryTag = String(deliveryTagCounter);
      return m;
    }
    return null;
  }

  function buildDelivery<TBody>(msg: StubMessage<TBody>): RabbitMQDelivery<TBody> {
    return {
      messageId: msg.messageId,
      queueName: msg.queueName,
      exchange: msg.exchange,
      routingKey: msg.routingKey,
      body: msg.body,
      headers: msg.headers,
      deliveryCount: msg.deliveryCount,
      deliveryTag: msg.deliveryTag ?? '',
      ack: () => {
        msg.state = 'acked';
        // Free the prefetch slot — pull any queued messages into the consumer.
        setTimeout(() => dispatchToConsumers(msg.queueName), 0);
      },
      nack: (opts) => {
        if (opts?.requeue) {
          msg.state = 'requeued';
          setTimeout(() => {
            msg.state = 'ready';
            dispatchToConsumers(msg.queueName);
          }, 0);
        } else {
          msg.state = 'nacked';
          setTimeout(() => dispatchToConsumers(msg.queueName), 0);
        }
      },
    };
  }

  function dispatchToConsumers(queueName: string): void {
    const cList = consumers.get(queueName);
    if (!cList || cList.length === 0) return;
    // Round-robin dispatch honouring prefetch.
    for (const consumer of cList) {
      if (consumer.cancelled) continue;
      const prefetch = consumer.options.prefetch ?? 0;
      while (true) {
        if (prefetch > 0) {
          const unacked = consumer.received.filter((m) => m.state === 'unacked').length;
          if (unacked >= prefetch) break;
        }
        const msg = popNextReadyMessage(queueName);
        if (!msg) return;
        consumer.received.push(msg);
        const delivery = buildDelivery(msg);
        const result = consumer.handler(delivery);
        if (result instanceof Promise) {
          result.catch(() => {
            // Handler errors do not auto-nack in AMQP — the message stays
            // in unacked state until the consumer explicitly nacks or the
            // channel drops. The stub mirrors this.
          });
        }
        if (consumer.options.noAck && msg.state === 'unacked') {
          msg.state = 'acked';
        }
      }
    }
  }

  // Seed topology from options.
  for (const spec of opts.exchanges ?? []) ensureExchange(spec);
  for (const spec of opts.queues ?? []) ensureQueue(spec);
  for (const spec of opts.bindings ?? []) bindings.push(spec);

  const env: RabbitMQTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'stub',
    amqpUrl: undefined,
    managementUrl: undefined,

    async declareExchange(spec) {
      ensureExchange(spec);
    },
    async declareQueue(spec) {
      ensureQueue(spec);
    },
    async bindQueue(spec) {
      if (!exchanges.has(spec.exchange) && spec.exchange !== '') {
        throw new Error(`bindQueue: exchange ${spec.exchange} not declared`);
      }
      if (!queues.has(spec.queue)) {
        throw new Error(`bindQueue: queue ${spec.queue} not declared`);
      }
      bindings.push(spec);
    },
    async unbindQueue(spec) {
      const idx = bindings.findIndex(
        (b) =>
          b.exchange === spec.exchange &&
          b.queue === spec.queue &&
          b.routingKey === spec.routingKey,
      );
      if (idx >= 0) bindings.splice(idx, 1);
    },

    async publish(input) {
      const targets = routeToQueues(input.exchange, input.routingKey, input.options?.headers ?? {});
      if (targets.length === 0) {
        // Unroutable — record on returned when mandatory.
        const stray = makeMessage({
          body: input.body,
          exchange: input.exchange,
          routingKey: input.routingKey,
          queueName: '',
          options: input.options,
        });
        published.push(stray as StubMessage);
        if (input.options?.mandatory) {
          stray.state = 'dead';
          stray.failedReason = 'unroutable';
          returned.push(stray as StubMessage);
        }
        return toSnapshot(stray);
      }
      let last: StubMessage<typeof input.body> | null = null;
      for (const q of targets) {
        const msg = makeMessage({
          body: input.body,
          exchange: input.exchange,
          routingKey: input.routingKey,
          queueName: q,
          options: input.options,
        });
        enqueue(q, msg);
        published.push(msg as StubMessage);
        last = msg;
      }
      return toSnapshot(last!);
    },

    async sendToQueue(input) {
      ensureQueue({ name: input.queue });
      const msg = makeMessage({
        body: input.body,
        exchange: '',
        routingKey: input.queue,
        queueName: input.queue,
        options: input.options,
      });
      enqueue(input.queue, msg);
      published.push(msg as StubMessage);
      return toSnapshot(msg);
    },

    peek: (<TBody = unknown>(queueName: string): RabbitMQMessageSnapshot<TBody>[] => {
      const list = messages.get(queueName) ?? [];
      return list.map((m) => toSnapshot(m)) as RabbitMQMessageSnapshot<TBody>[];
    }) as RabbitMQTestEnv<'mock'>['peek'],

    get: (async <TBody = unknown>(input: {
      queue: string;
      noAck?: boolean;
    }): Promise<RabbitMQDelivery<TBody> | null> => {
      if (!queues.has(input.queue)) {
        throw new Error(`get: queue ${input.queue} not declared`);
      }
      const msg = popNextReadyMessage(input.queue);
      if (!msg) return null;
      if (input.noAck) msg.state = 'acked';
      return buildDelivery(msg) as RabbitMQDelivery<TBody>;
    }) as RabbitMQTestEnv<'mock'>['get'],

    consume: (async <TBody = unknown>(input: {
      queue: string;
      handler: (delivery: RabbitMQDelivery<TBody>) => void | Promise<void>;
      options?: RabbitMQConsumeOptions;
    }): Promise<RabbitMQConsumer<TBody>> => {
      if (!queues.has(input.queue)) {
        throw new Error(`consume: queue ${input.queue} not declared`);
      }
      const list = consumers.get(input.queue) ?? [];
      if (list.some((c) => c.options.exclusive && !c.cancelled)) {
        throw new Error(`consume: queue ${input.queue} has exclusive consumer`);
      }
      if (input.options?.exclusive && list.some((c) => !c.cancelled)) {
        throw new Error(`consume: cannot register exclusive consumer, others already exist`);
      }
      const consumer: StubConsumer = {
        consumerTag: input.options?.consumerTag ?? `consumer-${randomUUID()}`,
        queueName: input.queue,
        handler: input.handler as StubConsumer['handler'],
        options: {
          noAck: input.options?.noAck ?? false,
          ...(input.options ?? {}),
        },
        cancelled: false,
        received: [],
      };
      list.push(consumer);
      consumers.set(input.queue, list);
      dispatchToConsumers(input.queue);
      return {
        consumerTag: consumer.consumerTag,
        queueName: input.queue,
        cancel: async () => {
          consumer.cancelled = true;
        },
        deliveries: () =>
          consumer.received.map((m) => toSnapshot(m)) as RabbitMQMessageSnapshot<TBody>[],
      };
    }) as RabbitMQTestEnv<'mock'>['consume'],

    waitForMessage: (async <TBody = unknown>(
      queueName: string,
      opts?: {
        timeoutMs?: number;
        match?: (m: RabbitMQMessageSnapshot<TBody>) => boolean;
      },
    ): Promise<RabbitMQMessageSnapshot<TBody>> => {
      const timeoutMs = opts?.timeoutMs ?? 5000;
      const match = opts?.match;
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const list = messages.get(queueName) ?? [];
        for (const m of list) {
          if (m.state === 'acked' || m.state === 'nacked' || m.state === 'dead') {
            const snap = toSnapshot(m) as RabbitMQMessageSnapshot<TBody>;
            if (!match || match(snap)) return snap;
          }
        }
        await new Promise((r) => setTimeout(r, 10));
      }
      throw new Error(`waitForMessage: timeout waiting for message on ${queueName}`);
    }) as RabbitMQTestEnv<'mock'>['waitForMessage'],

    assertAcknowledged: (async <TBody = unknown>(
      queueName: string,
      expected?: { deliveryCount?: number },
    ): Promise<RabbitMQMessageSnapshot<TBody>> => {
      const snap = await env.waitForMessage<TBody>(queueName, {
        match: (m) => m.state === 'acked',
      });
      if (expected?.deliveryCount !== undefined && snap.deliveryCount !== expected.deliveryCount) {
        throw new Error(
          `assertAcknowledged: expected deliveryCount ${expected.deliveryCount} but got ${snap.deliveryCount}`,
        );
      }
      return snap;
    }) as RabbitMQTestEnv<'mock'>['assertAcknowledged'],

    assertRequeued: (async <TBody = unknown>(
      queueName: string,
    ): Promise<RabbitMQMessageSnapshot<TBody>> => {
      // A requeued message will have deliveryCount >= 2 after redelivery.
      const start = Date.now();
      while (Date.now() - start < 5000) {
        const list = messages.get(queueName) ?? [];
        for (const m of list) {
          if (m.deliveryCount >= 2) return toSnapshot(m) as RabbitMQMessageSnapshot<TBody>;
        }
        await new Promise((r) => setTimeout(r, 10));
      }
      throw new Error(`assertRequeued: timeout waiting for requeued delivery on ${queueName}`);
    }) as RabbitMQTestEnv<'mock'>['assertRequeued'],

    async assertQueueDrained(queueName) {
      const list = messages.get(queueName) ?? [];
      const pending = list.filter((m) => m.state === 'ready' || m.state === 'unacked');
      if (pending.length > 0) {
        throw new Error(
          `assertQueueDrained: queue ${queueName} still has ${pending.length} pending messages`,
        );
      }
    },

    listPublished: (<TBody = unknown>(): RabbitMQMessageSnapshot<TBody>[] => {
      return published.map((m) => toSnapshot(m)) as RabbitMQMessageSnapshot<TBody>[];
    }) as RabbitMQTestEnv<'mock'>['listPublished'],
    listReturned: (<TBody = unknown>(): RabbitMQMessageSnapshot<TBody>[] => {
      return returned.map((m) => toSnapshot(m)) as RabbitMQMessageSnapshot<TBody>[];
    }) as RabbitMQTestEnv<'mock'>['listReturned'],

    async reset() {
      exchanges.clear();
      queues.clear();
      bindings.length = 0;
      messages.clear();
      consumers.clear();
      published.length = 0;
      returned.length = 0;
      deliveryTagCounter = 0;
    },

    async stop() {
      await env.reset();
    },
  };

  return env;
}

/** Exported for symmetry with the SQS adapter (currently unused externally). */
export type { RabbitMQExchangeType };
