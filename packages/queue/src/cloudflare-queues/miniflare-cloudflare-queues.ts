import type {
  CloudflareQueueBatch,
  CloudflareQueueConsumer,
  CloudflareQueueConsumerRegistration,
  CloudflareQueueMessage,
  CloudflareQueueMessageSnapshot,
  CloudflareQueueMessageState,
  CloudflareQueueSendOptions,
  CloudflareQueuesTestEnv,
  SetupCloudflareQueuesEnvOptions,
} from './types.js';

/**
 * Internal representation of a queued message. `state` walks
 * `pending → delivered → ack | retrying → dead` as the scheduler drains
 * batches.
 */
interface SimMessage<TBody = unknown> {
  id: string;
  queueName: string;
  body: TBody;
  attempts: number;
  state: CloudflareQueueMessageState;
  visibleAt: number;
  failedReason?: string | undefined;
  /** Ack / retry decision recorded during the current batch — resets each batch. */
  decision?: 'ack' | 'retry' | undefined;
}

function snapshotOf<TBody>(msg: SimMessage<TBody>): CloudflareQueueMessageSnapshot<TBody> {
  const snap: CloudflareQueueMessageSnapshot<TBody> = {
    id: msg.id,
    queueName: msg.queueName,
    body: msg.body,
    attempts: msg.attempts,
    state: msg.state,
    visibleAt: msg.visibleAt,
  };
  if (msg.failedReason !== undefined) snap.failedReason = msg.failedReason;
  return snap;
}

/**
 * Build a miniflare-shaped (offline, in-process) Cloudflare Queues env. The
 * simulation covers the message lifecycle observed by production Workers —
 * `send` / consumer batch / retry / DLQ — deterministically, without spinning
 * up a wrangler dev-server.
 *
 * When `opts.miniflare?.miniflare` is supplied the helper leaves lifecycle to
 * the caller and only consumes the injected instance for structural parity;
 * the internal simulation still drives message state so tests stay
 * deterministic.
 */
export function createMiniflareCloudflareQueuesEnv(
  opts: SetupCloudflareQueuesEnvOptions,
): CloudflareQueuesTestEnv<'mock'> {
  const pollIntervalMs = opts.miniflare?.pollIntervalMs ?? 1;
  const messages = new Map<string, SimMessage>();
  const dlqMessages = new Map<string, SimMessage[]>();
  const consumers = new Map<string, CloudflareQueueConsumerRegistration>();
  const queueNames = new Set<string>(opts.queues ?? []);
  let idCounter = 0;
  let stopped = false;
  let schedulerTimer: ReturnType<typeof setTimeout> | null = null;

  for (const reg of opts.consumers ?? []) {
    registerConsumerInternal(reg);
  }

  function registerConsumerInternal<TBody>(
    reg: CloudflareQueueConsumerRegistration<TBody>,
  ): void {
    if (!reg.queue || typeof reg.queue !== 'string') {
      throw new Error(
        'registerConsumer: `queue` must be a non-empty string identifying the source queue',
      );
    }
    // Replace any previously registered consumer for the same queue. Match
    // the intent of "swap the handler" without leaking stale references.
    consumers.set(reg.queue, reg as unknown as CloudflareQueueConsumerRegistration);
    queueNames.add(reg.queue);
    if (reg.deadLetterQueue) queueNames.add(reg.deadLetterQueue);
    // Kick the scheduler so a consumer registered after messages arrive still
    // picks them up on the next tick.
    scheduleTick();
  }

  function scheduleTick(): void {
    if (stopped || schedulerTimer !== null) return;
    schedulerTimer = setTimeout(() => {
      schedulerTimer = null;
      tick().catch(() => {
        // The scheduler tick catches consumer exceptions inside dispatchBatch
        // and never rethrows. This .catch is a defensive guard only.
      });
    }, pollIntervalMs);
    if (typeof schedulerTimer === 'object' && schedulerTimer !== null) {
      (schedulerTimer as { unref?: () => void }).unref?.();
    }
  }

  function nextId(): string {
    idCounter += 1;
    return `msg-${idCounter}`;
  }

  function assertNotStopped(): void {
    if (stopped) throw new Error('setupCloudflareQueuesEnv: cannot use env after stop()');
  }

  function pendingForQueue(queueName: string, now: number): SimMessage[] {
    const pending: SimMessage[] = [];
    for (const msg of messages.values()) {
      if (msg.queueName !== queueName) continue;
      if (msg.state !== 'pending' && msg.state !== 'retrying') continue;
      if (msg.visibleAt > now) continue;
      pending.push(msg);
    }
    // Sort deterministically by id — ids grow monotonically so this yields
    // FIFO ordering across concurrent sends at the same timestamp.
    pending.sort((a, b) => a.id.localeCompare(b.id, 'en'));
    return pending;
  }

  async function dispatchBatch(queueName: string, batchMessages: SimMessage[]): Promise<void> {
    const consumer = consumers.get(queueName);
    if (!consumer || batchMessages.length === 0) return;
    const maxRetries = consumer.maxRetries ?? 3;
    // Move every message to delivered + bump attempts before invoking the
    // handler so partial failures still observe the incremented counter.
    for (const msg of batchMessages) {
      msg.state = 'delivered';
      msg.attempts += 1;
      msg.decision = undefined;
    }
    const wireMessages: CloudflareQueueMessage[] = batchMessages.map((msg) => {
      let ackCalled = false;
      let retryCalled = false;
      return {
        id: msg.id,
        body: msg.body,
        timestamp: msg.visibleAt,
        attempts: msg.attempts,
        ack() {
          // Retries take precedence over acks on the same message so tests
          // that mistakenly call both surface as retries — mirrors production
          // where retry() always wins.
          if (retryCalled) return;
          if (ackCalled) return;
          ackCalled = true;
          msg.decision = 'ack';
        },
        retry() {
          if (retryCalled) return;
          retryCalled = true;
          msg.decision = 'retry';
        },
      };
    });
    const batch: CloudflareQueueBatch = {
      queue: queueName,
      messages: wireMessages,
      ackAll() {
        for (const wire of wireMessages) wire.ack();
      },
      retryAll() {
        for (const wire of wireMessages) wire.retry();
      },
    };
    let handlerError: Error | null = null;
    try {
      await (consumer.handler as CloudflareQueueConsumer)(batch);
    } catch (err) {
      handlerError = err instanceof Error ? err : new Error(String(err));
    }
    // Reconcile decisions.
    for (const msg of batchMessages) {
      if (handlerError !== null) {
        // A thrown handler retries every message in the batch — matches
        // production Cloudflare Queues, which never partial-acks a batch that
        // crashed.
        msg.failedReason = handlerError.message;
        transitionAfterHandler(msg, 'retry', maxRetries, consumer.deadLetterQueue);
        continue;
      }
      const decision = msg.decision ?? 'retry';
      // Messages left undecided fall back to retry — Cloudflare Queues docs
      // treat "unacked" as retryable so the helper mirrors that behaviour.
      transitionAfterHandler(msg, decision, maxRetries, consumer.deadLetterQueue);
    }
    // Once the batch settles kick the scheduler so retries flow into the next
    // batch instead of stalling until the next send.
    if (hasPending()) scheduleTick();
  }

  function transitionAfterHandler(
    msg: SimMessage,
    decision: 'ack' | 'retry',
    maxRetries: number,
    dlqName: string | undefined,
  ): void {
    if (decision === 'ack') {
      msg.state = 'ack';
      msg.failedReason = undefined;
      msg.decision = undefined;
      return;
    }
    // decision === 'retry'
    if (msg.attempts >= maxRetries) {
      msg.state = 'dead';
      msg.decision = undefined;
      if (dlqName) {
        const dlqEntries = dlqMessages.get(dlqName) ?? [];
        dlqEntries.push({ ...msg });
        dlqMessages.set(dlqName, dlqEntries);
        queueNames.add(dlqName);
      }
      return;
    }
    msg.state = 'retrying';
    msg.decision = undefined;
    // Retries become visible immediately in the miniflare backend — the
    // scheduler catches them on the next tick. Production waits for the
    // configured retryDelay; the helper trades that for determinism.
    msg.visibleAt = Date.now();
  }

  function hasPending(): boolean {
    for (const msg of messages.values()) {
      if (msg.state === 'pending' || msg.state === 'retrying' || msg.state === 'delivered') {
        return true;
      }
    }
    return false;
  }

  async function tick(): Promise<void> {
    if (stopped) return;
    // Move `pending` messages whose `visibleAt` has elapsed onto a per-queue
    // list, then dispatch batches to the registered consumer.
    const now = Date.now();
    const grouped = new Map<string, SimMessage[]>();
    for (const queueName of consumers.keys()) {
      const pending = pendingForQueue(queueName, now);
      if (pending.length > 0) grouped.set(queueName, pending);
    }
    for (const [queueName, pending] of grouped.entries()) {
      const consumer = consumers.get(queueName);
      if (!consumer) continue;
      const size = consumer.maxBatchSize ?? 10;
      if (size < 1) {
        throw new Error(
          `dispatch: maxBatchSize must be >= 1 for queue "${queueName}", got ${size}`,
        );
      }
      // Chunk pending messages by maxBatchSize; each chunk flushes as a batch.
      for (let i = 0; i < pending.length; i += size) {
        const chunk = pending.slice(i, i + size);
        // eslint-disable-next-line no-await-in-loop
        await dispatchBatch(queueName, chunk);
      }
    }
    if (hasPending()) scheduleTick();
  }

  const env: CloudflareQueuesTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'miniflare',
    devServerUrl: undefined,
    get queues() {
      return Array.from(queueNames.values());
    },
    registerConsumer(reg) {
      assertNotStopped();
      registerConsumerInternal(reg);
    },
    async send<TBody>(
      queueName: string,
      body: TBody,
      options?: CloudflareQueueSendOptions,
    ): Promise<CloudflareQueueMessageSnapshot<TBody>> {
      assertNotStopped();
      if (!queueName || typeof queueName !== 'string') {
        throw new Error('send: queueName must be a non-empty string');
      }
      const delaySeconds = options?.delaySeconds ?? 0;
      if (delaySeconds < 0) {
        throw new Error('send: delaySeconds must be non-negative');
      }
      const id = nextId();
      const visibleAt = Date.now() + delaySeconds * 1000;
      // contentType is accepted on the API for structural parity with
      // production Cloudflare Queues but the miniflare simulation stores the
      // body as-is (no wire serialisation), so the flag is not persisted.
      const msg: SimMessage<TBody> = {
        id,
        queueName,
        body,
        attempts: 0,
        state: 'pending',
        visibleAt,
      };
      messages.set(id, msg as unknown as SimMessage);
      queueNames.add(queueName);
      // Kick the scheduler immediately for zero-delay sends; delayed sends
      // rely on the scheduler polling once the visibility window opens.
      if (delaySeconds === 0) {
        scheduleTick();
      } else {
        setTimeout(() => {
          if (!stopped) scheduleTick();
        }, delaySeconds * 1000).unref?.();
      }
      return snapshotOf(msg);
    },
    waitForMessage: (async <TBody>(
      queueName: string,
      waitOpts?: { timeoutMs?: number | undefined },
    ): Promise<CloudflareQueueMessageSnapshot<TBody>> => {
      const timeoutMs = waitOpts?.timeoutMs ?? 5000;
      const deadline = Date.now() + timeoutMs;
      while (true) {
        for (const msg of messages.values()) {
          if (msg.queueName !== queueName) continue;
          if (msg.state === 'ack' || msg.state === 'dead') {
            return snapshotOf(msg) as CloudflareQueueMessageSnapshot<TBody>;
          }
        }
        if (Date.now() > deadline) {
          throw new Error(
            `waitForMessage: timeout waiting for queue "${queueName}" after ${timeoutMs}ms`,
          );
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, Math.min(10, pollIntervalMs * 5));
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
    }) as CloudflareQueuesTestEnv<'mock'>['waitForMessage'],
    assertAcknowledged: (async <TBody>(
      queueName: string,
      expected?: { attempts?: number | undefined } | undefined,
    ): Promise<CloudflareQueueMessageSnapshot<TBody>> => {
      const snap = await env.waitForMessage<TBody>(queueName);
      if (snap.state !== 'ack') {
        throw new Error(
          `assertAcknowledged: expected message on "${queueName}" to be acked, got state=${snap.state} reason=${snap.failedReason ?? 'unknown'}`,
        );
      }
      if (expected?.attempts !== undefined && snap.attempts !== expected.attempts) {
        throw new Error(
          `assertAcknowledged: expected ${expected.attempts} attempt(s), observed ${snap.attempts}`,
        );
      }
      return snap;
    }) as CloudflareQueuesTestEnv<'mock'>['assertAcknowledged'],
    assertDeadLettered: (async <TBody>(
      queueName: string,
      expected?: {
        dlq?: string | undefined;
        reasonMatch?: RegExp | undefined;
        attempts?: number | undefined;
      } | undefined,
    ): Promise<CloudflareQueueMessageSnapshot<TBody>> => {
      const snap = await env.waitForMessage<TBody>(queueName);
      if (snap.state !== 'dead') {
        throw new Error(
          `assertDeadLettered: expected message on "${queueName}" to be dead-lettered, got state=${snap.state}`,
        );
      }
      if (expected?.attempts !== undefined && snap.attempts !== expected.attempts) {
        throw new Error(
          `assertDeadLettered: expected ${expected.attempts} attempt(s), observed ${snap.attempts}`,
        );
      }
      if (expected?.reasonMatch && !expected.reasonMatch.test(snap.failedReason ?? '')) {
        throw new Error(
          `assertDeadLettered: failedReason "${snap.failedReason ?? ''}" did not match ${expected.reasonMatch}`,
        );
      }
      if (expected?.dlq) {
        const dlqEntries = dlqMessages.get(expected.dlq) ?? [];
        const found = dlqEntries.some((entry) => entry.id === snap.id);
        if (!found) {
          throw new Error(
            `assertDeadLettered: message "${snap.id}" was not routed to DLQ "${expected.dlq}" (observed queues: ${JSON.stringify(Array.from(dlqMessages.keys()))})`,
          );
        }
      }
      return snap;
    }) as CloudflareQueuesTestEnv<'mock'>['assertDeadLettered'],
    assertRetried: (async <TBody>(
      queueName: string,
      expectedRetries: number,
    ): Promise<CloudflareQueueMessageSnapshot<TBody>> => {
      const snap = await env.waitForMessage<TBody>(queueName);
      if (snap.attempts !== expectedRetries) {
        throw new Error(
          `assertRetried: expected ${expectedRetries} attempt(s) for "${queueName}", observed ${snap.attempts}`,
        );
      }
      return snap;
    }) as CloudflareQueuesTestEnv<'mock'>['assertRetried'],
    async assertQueueDrained(queueName?: string | undefined) {
      // Poll pending / delivered / retrying count for ~250ms.
      for (let i = 0; i < 50; i += 1) {
        let pending = 0;
        for (const msg of messages.values()) {
          if (queueName !== undefined && msg.queueName !== queueName) continue;
          if (
            msg.state === 'pending' ||
            msg.state === 'delivered' ||
            msg.state === 'retrying'
          ) {
            pending += 1;
          }
        }
        if (pending === 0) return;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 5);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
      throw new Error(
        `assertQueueDrained: queue${queueName ? ` "${queueName}"` : 's'} still have pending / delivered / retrying messages after 250ms`,
      );
    },
    listMessages(queueName?: string | undefined) {
      const out: CloudflareQueueMessageSnapshot[] = [];
      for (const msg of messages.values()) {
        if (queueName !== undefined && msg.queueName !== queueName) continue;
        out.push(snapshotOf(msg));
      }
      return out;
    },
    listDeadLetters(dlqName?: string | undefined) {
      if (dlqName !== undefined) {
        const entries = dlqMessages.get(dlqName) ?? [];
        return entries.map((msg) => snapshotOf(msg));
      }
      const all: CloudflareQueueMessageSnapshot[] = [];
      for (const entries of dlqMessages.values()) {
        for (const msg of entries) all.push(snapshotOf(msg));
      }
      return all;
    },
    async stop() {
      stopped = true;
      if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
      }
      messages.clear();
      dlqMessages.clear();
      consumers.clear();
      queueNames.clear();
    },
  };
  return env;
}
