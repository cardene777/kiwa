import type { TestEnvBase, TestMode } from '@kiwa-lab/core';

/**
 * RabbitMQ backend selection.
 * - `stub` — in-process AMQP 0.9.1 model emulation. No docker, no network.
 *   Fast + deterministic — enough to exercise exchange / queue / binding /
 *   consumer / ack / nack / prefetch semantics without spinning up a broker.
 * - `testcontainers` — spawn a real `rabbitmq:3-management` container. The
 *   env exposes the amqp URL + management UI URL so consumers can drive the
 *   real broker via amqplib.
 */
export type RabbitMQMode = 'stub' | 'testcontainers';

/** AMQP 0.9.1 exchange types the adapter covers. */
export type RabbitMQExchangeType = 'direct' | 'topic' | 'fanout' | 'headers';

/** Terminal + intermediate states surfaced by the helper. */
export type RabbitMQMessageState =
  | 'ready'
  | 'unacked'
  | 'acked'
  | 'nacked'
  | 'requeued'
  | 'dead';

/** Structural mirror of a persisted AMQP message. */
export interface RabbitMQMessageSnapshot<TBody = unknown> {
  messageId: string;
  queueName: string;
  exchange: string;
  routingKey: string;
  body: TBody;
  headers: Record<string, unknown>;
  deliveryCount: number;
  state: RabbitMQMessageState;
  failedReason?: string | undefined;
  /** Persistent flag — AMQP `deliveryMode=2` mirror. */
  persistent: boolean;
  /** ISO ms timestamp — enqueue time. */
  enqueuedAt: number;
}

/** Options accepted by every publish. */
export interface RabbitMQPublishOptions {
  /** Overrides `messageId` — otherwise auto-generated. */
  messageId?: string | undefined;
  /** Additional AMQP headers (also read by `headers` exchanges). */
  headers?: Record<string, unknown> | undefined;
  /**
   * Delivery mode. `persistent` messages survive broker restarts in production;
   * the stub tracks the flag so tests can assert against it.
   */
  persistent?: boolean | undefined;
  /**
   * Mandatory flag — real RabbitMQ returns the message when no binding matches
   * and `mandatory=true`. The stub records the return so tests can assert on
   * unroutable publishes.
   */
  mandatory?: boolean | undefined;
  /** AMQP `expiration` per-message TTL (milliseconds), applied on the stub. */
  expirationMs?: number | undefined;
  /** AMQP `priority` — 0..9. */
  priority?: number | undefined;
}

/** Consume options. */
export interface RabbitMQConsumeOptions {
  /**
   * When true, messages are auto-acknowledged upon receipt (no consumer ack
   * required). Defaults to false — consumers must call `ack(msg)` or
   * `nack(msg)` explicitly.
   */
  noAck?: boolean | undefined;
  /**
   * Consumer tag — mirrors AMQP's `consumerTag`. Auto-generated when omitted.
   */
  consumerTag?: string | undefined;
  /**
   * Per-consumer prefetch (QoS) — max unacked messages the consumer holds at
   * once. Real RabbitMQ enforces via `basic.qos`. Defaults to 0 (unlimited).
   */
  prefetch?: number | undefined;
  /**
   * When true the consumer is invoked exclusively (no other consumers on the
   * queue). The stub honours this by rejecting subsequent consumer registrations.
   */
  exclusive?: boolean | undefined;
}

/** Exchange declaration. */
export interface RabbitMQExchangeSpec {
  name: string;
  type: RabbitMQExchangeType;
  /** Durable flag — mirrors AMQP `durable=true` (stub tracks the flag). */
  durable?: boolean | undefined;
  /** Auto-delete flag — mirrors AMQP `autoDelete`. */
  autoDelete?: boolean | undefined;
  internal?: boolean | undefined;
  /** Additional exchange arguments. */
  args?: Record<string, unknown> | undefined;
}

/** Queue declaration. */
export interface RabbitMQQueueSpec {
  name: string;
  durable?: boolean | undefined;
  autoDelete?: boolean | undefined;
  exclusive?: boolean | undefined;
  /**
   * Queue-level max unacked messages — mirrors `x-max-length` in real Rabbit.
   * The stub tracks the limit for assertion purposes but does not block sends.
   */
  maxLength?: number | undefined;
  /** Additional queue arguments (x-* fields). */
  args?: Record<string, unknown> | undefined;
}

/** Binding declaration. */
export interface RabbitMQBindingSpec {
  exchange: string;
  queue: string;
  /**
   * Routing key. Empty string for `fanout` (ignored) and headers exchanges.
   * For `topic` supports `*` (single word) + `#` (multiple words) wildcards.
   */
  routingKey: string;
  /**
   * Header match args for `headers` exchanges. `x-match=all` (all headers must
   * match) or `x-match=any` (any). Defaults to `all` when omitted.
   */
  args?: Record<string, unknown> | undefined;
}

/** Delivered message wrapper — consumer receives one of these per delivery. */
export interface RabbitMQDelivery<TBody = unknown> {
  messageId: string;
  queueName: string;
  exchange: string;
  routingKey: string;
  body: TBody;
  headers: Record<string, unknown>;
  deliveryCount: number;
  deliveryTag: string;
  /** Acknowledge the delivery — removes the message from the queue. */
  ack: () => void;
  /**
   * Negative acknowledge — when `requeue=true` the message goes back to the
   * head of the queue; when false it is discarded (or routed to the DLX if
   * bound).
   */
  nack: (opts?: { requeue?: boolean }) => void;
}

/** Consumer registration handle. */
export interface RabbitMQConsumer<TBody = unknown> {
  consumerTag: string;
  queueName: string;
  cancel: () => Promise<void>;
  /** Introspection — every delivery the consumer received. */
  deliveries: () => Array<RabbitMQMessageSnapshot<TBody>>;
}

/** Options for the testcontainers backend. */
export interface RabbitMQTestcontainersOptions {
  /** Docker image. Defaults to `rabbitmq:3-management`. */
  image?: string | undefined;
  /**
   * Reuse an existing amqp URL (e.g. `amqp://guest:guest@localhost:5672`)
   * instead of spawning a container.
   */
  amqpUrl?: string | undefined;
  /** Startup timeout for auto-spawn (ms). Defaults to 60_000. */
  startupTimeoutMs?: number | undefined;
  /** Extra environment vars for the container. */
  env?: Record<string, string> | undefined;
}

/** Common options for the `setupRabbitMQEnv` factory. */
export interface SetupRabbitMQEnvOptions {
  mode?: RabbitMQMode | undefined;
  /** Exchanges to declare at env creation time. */
  exchanges?: RabbitMQExchangeSpec[] | undefined;
  /** Queues to declare at env creation time. */
  queues?: RabbitMQQueueSpec[] | undefined;
  /** Bindings to declare at env creation time. */
  bindings?: RabbitMQBindingSpec[] | undefined;
  testcontainers?: RabbitMQTestcontainersOptions | undefined;
}

/**
 * RabbitMQ test env. Reads much like a mini AMQP channel facade — consumers
 * declare topology, publish + consume messages, and use the assertion helpers
 * to observe outcomes without touching a real broker.
 */
export interface RabbitMQTestEnv<TMode extends TestMode = TestMode>
  extends TestEnvBase<TMode> {
  backend: RabbitMQMode;
  /** Amqp URL — undefined in stub mode. */
  amqpUrl: string | undefined;
  /** Management UI URL — populated in testcontainers mode. */
  managementUrl: string | undefined;

  /** Declare an exchange. Idempotent for identical redeclarations. */
  declareExchange: (spec: RabbitMQExchangeSpec) => Promise<void>;
  /** Declare a queue. */
  declareQueue: (spec: RabbitMQQueueSpec) => Promise<void>;
  /** Bind a queue to an exchange. */
  bindQueue: (spec: RabbitMQBindingSpec) => Promise<void>;
  /** Unbind a queue from an exchange. */
  unbindQueue: (spec: RabbitMQBindingSpec) => Promise<void>;

  /** Publish a message to an exchange with routing key. */
  publish: <TBody = unknown>(input: {
    exchange: string;
    routingKey: string;
    body: TBody;
    options?: RabbitMQPublishOptions;
  }) => Promise<RabbitMQMessageSnapshot<TBody>>;

  /**
   * Directly enqueue on a queue — mirrors amqplib's default-exchange shortcut
   * where publishing on `""` with a routing key equal to the queue name puts
   * the message straight on the queue.
   */
  sendToQueue: <TBody = unknown>(input: {
    queue: string;
    body: TBody;
    options?: RabbitMQPublishOptions;
  }) => Promise<RabbitMQMessageSnapshot<TBody>>;

  /**
   * Peek at the messages currently on a queue — read-only, does not consume.
   */
  peek: <TBody = unknown>(queueName: string) => RabbitMQMessageSnapshot<TBody>[];

  /**
   * Get one message off the queue — mirrors AMQP `basic.get`. Returns null
   * when the queue is empty.
   */
  get: <TBody = unknown>(input: {
    queue: string;
    noAck?: boolean;
  }) => Promise<RabbitMQDelivery<TBody> | null>;

  /** Register a push-based consumer. */
  consume: <TBody = unknown>(input: {
    queue: string;
    handler: (delivery: RabbitMQDelivery<TBody>) => void | Promise<void>;
    options?: RabbitMQConsumeOptions;
  }) => Promise<RabbitMQConsumer<TBody>>;

  /**
   * Wait for a queue's next message (or a matching one) to reach a terminal
   * state (`acked` / `nacked` / `dead`). Rejects on timeout.
   */
  waitForMessage: <TBody = unknown>(
    queueName: string,
    opts?: { timeoutMs?: number; match?: (m: RabbitMQMessageSnapshot<TBody>) => boolean },
  ) => Promise<RabbitMQMessageSnapshot<TBody>>;

  /** Assertion — the next message on `queueName` was acked. */
  assertAcknowledged: <TBody = unknown>(
    queueName: string,
    expected?: { deliveryCount?: number } | undefined,
  ) => Promise<RabbitMQMessageSnapshot<TBody>>;

  /** Assertion — the next message on `queueName` was requeued after a nack. */
  assertRequeued: <TBody = unknown>(
    queueName: string,
  ) => Promise<RabbitMQMessageSnapshot<TBody>>;

  /** Assertion — the queue is empty (no ready + no unacked). */
  assertQueueDrained: (queueName: string) => Promise<void>;

  /** Introspection — every publish the env has observed. */
  listPublished: <TBody = unknown>() => RabbitMQMessageSnapshot<TBody>[];

  /** Introspection — messages that were published as mandatory + unroutable. */
  listReturned: <TBody = unknown>() => RabbitMQMessageSnapshot<TBody>[];

  /** Reset all in-memory state. */
  reset: () => Promise<void>;
}
