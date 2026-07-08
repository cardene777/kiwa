import type { TestEnvBase, TestMode } from '@kiwa/core';

/**
 * Cloudflare Queues backend selection.
 * - `miniflare`: run against an in-process Cloudflare-shaped Queue simulation
 *   powered by miniflare (no wrangler subprocess, no network). Fast, offline,
 *   fully deterministic. Suitable for unit tests that need to exercise the
 *   send / consumer batch / retry / DLQ semantics without spinning up an
 *   external process.
 * - `wrangler`: probe or auto-spawn a real Wrangler dev-server process
 *   (`wrangler dev --queue`). Exercises the actual wrangler wire while the
 *   consumer batch handler still executes in-process (v0.2 scope) so tests
 *   stay deterministic.
 */
export type CloudflareQueuesMode = 'miniflare' | 'wrangler';

/**
 * Terminal + intermediate states surfaced by the helper. `pending` messages
 * live in the queue waiting for the next consumer batch. `delivered` messages
 * are the ones consumer batches saw and either ack'd or retried. `retrying`
 * covers explicit `msg.retry()` calls that pushed a message back for another
 * batch. `dead` covers messages that exhausted `maxRetries` and were shunted
 * into the dead-letter queue.
 */
export type CloudflareQueueMessageState =
  | 'pending'
  | 'delivered'
  | 'retrying'
  | 'ack'
  | 'dead';

/** Structural mirror of a persisted Cloudflare Queues message. */
export interface CloudflareQueueMessageSnapshot<TBody = unknown> {
  id: string;
  queueName: string;
  body: TBody;
  attempts: number;
  state: CloudflareQueueMessageState;
  failedReason?: string | undefined;
  /**
   * ISO timestamp (ms since epoch) capturing when the message became visible
   * for the next consumer batch. For pending messages the value reflects the
   * scheduled visibility (send + delay); for terminal messages it reflects the
   * final observed batch time.
   */
  visibleAt: number;
}

/**
 * Options accepted by every {@link CloudflareQueuesTestEnv.send} call. Mirrors
 * the subset of `Queue.send` options we honour in both backends.
 */
export interface CloudflareQueueSendOptions {
  /**
   * Delay before the message becomes eligible for the next consumer batch
   * (seconds). Real Cloudflare Queues uses seconds so the helper follows
   * suit. Defaults to 0.
   */
  delaySeconds?: number | undefined;
  /**
   * Optional content type hint — real Cloudflare Queues honours JSON / text /
   * bytes / v8 for serialisation. The helper records the value on the
   * message snapshot but stores the body as-is (structural clone).
   */
  contentType?: 'json' | 'text' | 'bytes' | 'v8' | undefined;
}

/**
 * The consumer batch delivered to the handler. Mirrors the shape production
 * Workers see via the `queue(batch, env, ctx)` binding.
 */
export interface CloudflareQueueBatch<TBody = unknown> {
  /** Queue name that produced the batch. */
  queue: string;
  /** Messages included in this batch. */
  messages: CloudflareQueueMessage<TBody>[];
  /** Convenience — ack every message in the batch. */
  ackAll: () => void;
  /** Convenience — retry every message in the batch. */
  retryAll: () => void;
}

/**
 * Individual message inside a batch. Consumers call `.ack()` on success or
 * `.retry()` to push the message back for another batch. Unhandled messages
 * behave as retries — matching Cloudflare Queues production semantics.
 */
export interface CloudflareQueueMessage<TBody = unknown> {
  id: string;
  body: TBody;
  timestamp: number;
  attempts: number;
  ack: () => void;
  retry: () => void;
}

/**
 * Consumer handler signature — mirrors the shape of the Workers `queue()`
 * entrypoint.
 */
export type CloudflareQueueConsumer<TBody = unknown> = (
  batch: CloudflareQueueBatch<TBody>,
) => Promise<void> | void;

/**
 * Options for the miniflare backend. Ignored when `mode === 'wrangler'`.
 */
export interface CloudflareQueuesMiniflareOptions {
  /**
   * How often the miniflare-shaped scheduler pumps pending messages (ms).
   * Defaults to 1 which is the finest resolution the implementation supports.
   */
  pollIntervalMs?: number | undefined;
  /**
   * Optional externally-managed Miniflare instance. When supplied the helper
   * hooks into that instance instead of building an internal simulation. The
   * external instance is not owned by the env — the caller stays responsible
   * for its lifecycle.
   */
  miniflare?: unknown | undefined;
}

/**
 * Options for the wrangler backend. Ignored when `mode === 'miniflare'`.
 */
export interface CloudflareQueuesWranglerOptions {
  /**
   * Path to an externally-managed Wrangler dev-server binding. When set the
   * helper reuses the process instead of spawning `wrangler dev --queue`.
   */
  url?: string | undefined;
  /** Port for the auto-spawned wrangler dev-server. Defaults to `8787`. */
  port?: number | undefined;
  /**
   * Milliseconds to wait for the auto-spawned wrangler dev-server before
   * timing out. Defaults to `15000`.
   */
  startupTimeoutMs?: number | undefined;
}

/**
 * Consumer registration — mirrors the [[queues.consumers]] entry in
 * `wrangler.toml`.
 */
export interface CloudflareQueueConsumerRegistration<TBody = unknown> {
  /** Queue name the consumer listens on. */
  queue: string;
  /** Handler executed for every batch. */
  handler: CloudflareQueueConsumer<TBody>;
  /**
   * Batch delivery limit. Real Cloudflare Queues supports 1-100; helper
   * enforces `>= 1` but does not cap the upper bound so tests can inject
   * bespoke shapes. Defaults to 10 (matching production default).
   */
  maxBatchSize?: number | undefined;
  /**
   * Max time (ms) the helper waits before flushing a partial batch. Defaults
   * to 5000 (matching production default of 5s).
   */
  maxBatchTimeoutMs?: number | undefined;
  /**
   * Max number of retries before the message is shunted to the dead-letter
   * queue. Defaults to 3 (matching production default).
   */
  maxRetries?: number | undefined;
  /**
   * Name of the dead-letter queue that receives messages after `maxRetries`
   * failures. When omitted messages that exhaust their retries transition to
   * the `dead` state but are not routed anywhere.
   */
  deadLetterQueue?: string | undefined;
}

/** Common options for the `setupCloudflareQueuesEnv` factory. */
export interface SetupCloudflareQueuesEnvOptions {
  /** Backend selector. Defaults to `'miniflare'`. */
  mode?: CloudflareQueuesMode | undefined;
  /**
   * Queue names the env pre-provisions. Additional queues are created lazily
   * on the first `send` / `registerConsumer` call, so this list is optional.
   */
  queues?: string[] | undefined;
  /**
   * Consumers registered at env creation time. Registering a duplicate
   * `queue` overwrites the previous handler.
   */
  consumers?: CloudflareQueueConsumerRegistration[] | undefined;
  /** miniflare overrides. */
  miniflare?: CloudflareQueuesMiniflareOptions | undefined;
  /** wrangler overrides. */
  wrangler?: CloudflareQueuesWranglerOptions | undefined;
}

/**
 * Return type of {@link setupCloudflareQueuesEnv}. Reads much like a mini
 * Cloudflare Queues facade — consumers register batch handlers, then use the
 * assertion helpers to observe outcomes without touching the wire.
 */
export interface CloudflareQueuesTestEnv<TMode extends TestMode = TestMode>
  extends TestEnvBase<TMode> {
  /** Chosen backend — mirrors the `mode` parameter. */
  backend: CloudflareQueuesMode;
  /** Optional dev-server URL — undefined in miniflare mode. */
  devServerUrl: string | undefined;
  /** Queue names the env has observed at least one send / consumer for. */
  queues: string[];

  /** Register (or replace) a consumer for a queue. */
  registerConsumer: <TBody = unknown>(
    registration: CloudflareQueueConsumerRegistration<TBody>,
  ) => void;

  /**
   * Enqueue a message. Returns the snapshot at enqueue time so tests can
   * capture the assigned id.
   */
  send: <TBody = unknown>(
    queueName: string,
    body: TBody,
    options?: CloudflareQueueSendOptions,
  ) => Promise<CloudflareQueueMessageSnapshot<TBody>>;

  /**
   * Wait for at least one message on `queueName` to reach a terminal state
   * (`ack` or `dead`). Rejects on timeout (default 5s).
   */
  waitForMessage: <TBody = unknown>(
    queueName: string,
    opts?: { timeoutMs?: number | undefined },
  ) => Promise<CloudflareQueueMessageSnapshot<TBody>>;

  /** Assertion — the first message on `queueName` reached `ack`. */
  assertAcknowledged: <TBody = unknown>(
    queueName: string,
    expected?: { attempts?: number | undefined } | undefined,
  ) => Promise<CloudflareQueueMessageSnapshot<TBody>>;

  /** Assertion — the first message on `queueName` was routed to the DLQ. */
  assertDeadLettered: <TBody = unknown>(
    queueName: string,
    expected?: {
      dlq?: string | undefined;
      reasonMatch?: RegExp | undefined;
      attempts?: number | undefined;
    } | undefined,
  ) => Promise<CloudflareQueueMessageSnapshot<TBody>>;

  /** Assertion — the first message on `queueName` was retried `expectedRetries` times. */
  assertRetried: <TBody = unknown>(
    queueName: string,
    expectedRetries: number,
  ) => Promise<CloudflareQueueMessageSnapshot<TBody>>;

  /** Assertion — the queue has no pending / delivered messages. */
  assertQueueDrained: (queueName?: string | undefined) => Promise<void>;

  /** Introspection helper — every message snapshot the env has ever seen. */
  listMessages: (queueName?: string | undefined) => CloudflareQueueMessageSnapshot[];

  /**
   * Introspection helper — every message routed to the DLQ (per queue). Empty
   * when no consumer is registered with `deadLetterQueue`.
   */
  listDeadLetters: (dlqName?: string | undefined) => CloudflareQueueMessageSnapshot[];
}
