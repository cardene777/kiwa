import type {
  SetupSQSEnvOptions,
  SQSBatchDeleteEntry,
  SQSBatchSendEntry,
  SQSMessageSnapshot,
  SQSMessageState,
  SQSQueueKind,
  SQSQueueSpec,
  SQSReceiveOptions,
  SQSReceivedMessage,
  SQSSendOptions,
  SQSTestEnv,
} from './types.js';

interface StubMessage<TBody = unknown> {
  messageId: string;
  queueName: string;
  body: TBody;
  receiveCount: number;
  state: SQSMessageState;
  visibleAt: number;
  failedReason?: string | undefined;
  messageGroupId?: string | undefined;
  messageDeduplicationId?: string | undefined;
  receiptHandle?: string | undefined;
}

interface StubQueue {
  name: string;
  kind: SQSQueueKind;
  visibilityTimeoutSeconds: number;
  redrivePolicy?: {
    deadLetterTargetArn: string;
    maxReceiveCount: number;
  } | undefined;
  /** FIFO deduplication cache — dedup id → messageId. */
  dedupCache: Map<string, string>;
}

function snapshotOf<TBody>(msg: StubMessage<TBody>): SQSMessageSnapshot<TBody> {
  const snap: SQSMessageSnapshot<TBody> = {
    messageId: msg.messageId,
    queueName: msg.queueName,
    body: msg.body,
    receiveCount: msg.receiveCount,
    state: msg.state,
    visibleAt: msg.visibleAt,
  };
  if (msg.failedReason !== undefined) snap.failedReason = msg.failedReason;
  if (msg.messageGroupId !== undefined) snap.messageGroupId = msg.messageGroupId;
  if (msg.messageDeduplicationId !== undefined) {
    snap.messageDeduplicationId = msg.messageDeduplicationId;
  }
  return snap;
}

/**
 * Build an in-process stub of AWS SQS covering the message lifecycle observed
 * by production consumers — `send` / `receive` / `delete` / batch / visibility
 * timeout / DLQ / FIFO deduplication — deterministically, without spinning
 * up localstack.
 */
export function createStubSQSEnv(opts: SetupSQSEnvOptions): SQSTestEnv<'mock'> {
  const queues = new Map<string, StubQueue>();
  const messages = new Map<string, StubMessage>();
  const dlqMessages = new Map<string, StubMessage[]>();
  let idCounter = 0;
  let receiptCounter = 0;
  let stopped = false;

  function nextMessageId(): string {
    idCounter += 1;
    return `stub-msg-${idCounter}`;
  }

  function nextReceiptHandle(): string {
    receiptCounter += 1;
    return `stub-rh-${receiptCounter}`;
  }

  function assertNotStopped(): void {
    if (stopped) throw new Error('setupSQSEnv: cannot use env after stop()');
  }

  function assertQueueExists(name: string): StubQueue {
    const queue = queues.get(name);
    if (!queue) {
      throw new Error(
        `setupSQSEnv: queue "${name}" does not exist — call createQueue() or pass it via setupSQSEnv({ queues })`,
      );
    }
    return queue;
  }

  function createQueueInternal(spec: SQSQueueSpec): void {
    if (!spec.name || typeof spec.name !== 'string') {
      throw new Error('createQueue: `name` must be a non-empty string');
    }
    const kind = spec.kind ?? 'standard';
    if (kind === 'fifo' && !spec.name.endsWith('.fifo')) {
      throw new Error(
        `createQueue: FIFO queue name "${spec.name}" must end with ".fifo" (AWS SQS constraint)`,
      );
    }
    queues.set(spec.name, {
      name: spec.name,
      kind,
      visibilityTimeoutSeconds: spec.visibilityTimeoutSeconds ?? 30,
      redrivePolicy: spec.redrivePolicy,
      dedupCache: new Map(),
    });
  }

  for (const spec of opts.queues ?? []) createQueueInternal(spec);

  function pendingForQueue(queueName: string, now: number): StubMessage[] {
    // Reap in-flight messages whose visibility timeout expired.
    for (const msg of messages.values()) {
      if (msg.queueName !== queueName) continue;
      if (msg.state === 'inflight' && msg.visibleAt <= now) {
        msg.state = 'pending';
        msg.receiptHandle = undefined;
      }
    }
    const pending: StubMessage[] = [];
    for (const msg of messages.values()) {
      if (msg.queueName !== queueName) continue;
      if (msg.state !== 'pending') continue;
      if (msg.visibleAt > now) continue;
      pending.push(msg);
    }
    pending.sort((a, b) => a.messageId.localeCompare(b.messageId, 'en'));
    return pending;
  }

  function routeToDLQ(msg: StubMessage, dlqName: string): void {
    const entries = dlqMessages.get(dlqName) ?? [];
    entries.push({ ...msg });
    dlqMessages.set(dlqName, entries);
  }

  function sendInternal<TBody>(
    queueName: string,
    body: TBody,
    options?: SQSSendOptions,
  ): SQSMessageSnapshot<TBody> {
    assertNotStopped();
    if (!queueName || typeof queueName !== 'string') {
      throw new Error('send: queueName must be a non-empty string');
    }
    const queue = assertQueueExists(queueName);
    const delaySeconds = options?.delaySeconds ?? 0;
    if (delaySeconds < 0) throw new Error('send: delaySeconds must be non-negative');
    if (delaySeconds > 900) {
      throw new Error(
        'send: delaySeconds cannot exceed 900 (AWS SQS constraint mirrored by the stub)',
      );
    }
    if (queue.kind === 'fifo') {
      if (!options?.messageGroupId) {
        throw new Error(
          `send: FIFO queue "${queueName}" requires messageGroupId — pass it via send options`,
        );
      }
      const dedupId = options?.messageDeduplicationId;
      if (dedupId !== undefined) {
        const cached = queue.dedupCache.get(dedupId);
        if (cached) {
          const existing = messages.get(cached);
          if (existing) return snapshotOf(existing) as SQSMessageSnapshot<TBody>;
        }
      }
    }
    const messageId = nextMessageId();
    const msg: StubMessage<TBody> = {
      messageId,
      queueName,
      body,
      receiveCount: 0,
      state: 'pending',
      visibleAt: Date.now() + delaySeconds * 1000,
    };
    if (options?.messageGroupId !== undefined) msg.messageGroupId = options.messageGroupId;
    if (options?.messageDeduplicationId !== undefined) {
      msg.messageDeduplicationId = options.messageDeduplicationId;
      queue.dedupCache.set(options.messageDeduplicationId, messageId);
    }
    messages.set(messageId, msg as unknown as StubMessage);
    return snapshotOf(msg);
  }

  const env: SQSTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'stub',
    endpoint: undefined,
    get queues() {
      return Array.from(queues.keys());
    },
    async createQueue(spec: SQSQueueSpec) {
      assertNotStopped();
      createQueueInternal(spec);
    },
    async send<TBody>(
      queueName: string,
      body: TBody,
      options?: SQSSendOptions,
    ): Promise<SQSMessageSnapshot<TBody>> {
      return sendInternal(queueName, body, options);
    },
    async sendBatch<TBody>(
      queueName: string,
      entries: SQSBatchSendEntry<TBody>[],
    ): Promise<SQSMessageSnapshot<TBody>[]> {
      assertNotStopped();
      if (entries.length === 0) return [];
      if (entries.length > 10) {
        throw new Error(
          'sendBatch: SQS SendMessageBatch caps at 10 entries per call',
        );
      }
      const out: SQSMessageSnapshot<TBody>[] = [];
      for (const entry of entries) {
        out.push(sendInternal(queueName, entry.body, entry.options));
      }
      return out;
    },
    async receive<TBody>(
      queueName: string,
      options?: SQSReceiveOptions,
    ): Promise<SQSReceivedMessage<TBody>[]> {
      assertNotStopped();
      const queue = assertQueueExists(queueName);
      const maxMessages = Math.min(options?.maxMessages ?? 1, 10);
      const visibilityTimeoutSeconds =
        options?.visibilityTimeoutSeconds ?? queue.visibilityTimeoutSeconds;
      const waitTimeSeconds = options?.waitTimeSeconds ?? 0;
      const deadline = Date.now() + waitTimeSeconds * 1000;
      while (true) {
        const now = Date.now();
        const pending = pendingForQueue(queueName, now).slice(0, maxMessages);
        if (pending.length > 0) {
          const out: SQSReceivedMessage<TBody>[] = [];
          for (const msg of pending) {
            msg.state = 'inflight';
            msg.receiveCount += 1;
            msg.visibleAt = Date.now() + visibilityTimeoutSeconds * 1000;
            msg.receiptHandle = nextReceiptHandle();
            const received: SQSReceivedMessage<TBody> = {
              messageId: msg.messageId,
              receiptHandle: msg.receiptHandle,
              body: msg.body as TBody,
              receiveCount: msg.receiveCount,
              delete: () => {
                if (msg.state === 'deleted' || msg.state === 'dead') return;
                msg.state = 'deleted';
                msg.receiptHandle = undefined;
              },
              changeVisibility: (timeoutSeconds: number) => {
                if (msg.state !== 'inflight') return;
                msg.visibleAt = Date.now() + timeoutSeconds * 1000;
              },
            };
            if (msg.messageGroupId !== undefined) {
              received.messageGroupId = msg.messageGroupId;
            }
            if (msg.messageDeduplicationId !== undefined) {
              received.messageDeduplicationId = msg.messageDeduplicationId;
            }
            out.push(received);
            // Redrive policy — send messages that exceeded maxReceiveCount to DLQ.
            if (
              queue.redrivePolicy &&
              msg.receiveCount > queue.redrivePolicy.maxReceiveCount
            ) {
              msg.state = 'dead';
              routeToDLQ(msg, queue.redrivePolicy.deadLetterTargetArn);
            }
          }
          return out;
        }
        if (Date.now() >= deadline) return [];
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 10);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
    },
    async deleteBatch(queueName: string, entries: SQSBatchDeleteEntry[]) {
      assertNotStopped();
      assertQueueExists(queueName);
      if (entries.length > 10) {
        throw new Error(
          'deleteBatch: SQS DeleteMessageBatch caps at 10 entries per call',
        );
      }
      for (const entry of entries) {
        const msg = messages.get(entry.id);
        if (!msg) continue;
        if (msg.receiptHandle !== entry.receiptHandle) continue;
        if (msg.state === 'deleted' || msg.state === 'dead') continue;
        msg.state = 'deleted';
        msg.receiptHandle = undefined;
      }
    },
    waitForMessage: (async <TBody>(
      queueName: string,
      waitOpts?: { timeoutMs?: number | undefined },
    ): Promise<SQSMessageSnapshot<TBody>> => {
      const timeoutMs = waitOpts?.timeoutMs ?? 5000;
      const deadline = Date.now() + timeoutMs;
      while (true) {
        for (const msg of messages.values()) {
          if (msg.queueName !== queueName) continue;
          if (msg.state === 'deleted' || msg.state === 'dead') {
            return snapshotOf(msg) as SQSMessageSnapshot<TBody>;
          }
        }
        if (Date.now() > deadline) {
          throw new Error(
            `waitForMessage: timeout waiting for queue "${queueName}" after ${timeoutMs}ms`,
          );
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 10);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
    }) as SQSTestEnv<'mock'>['waitForMessage'],
    assertDeleted: (async <TBody>(
      queueName: string,
      expected?: { receiveCount?: number | undefined } | undefined,
    ): Promise<SQSMessageSnapshot<TBody>> => {
      const snap = await env.waitForMessage<TBody>(queueName);
      if (snap.state !== 'deleted') {
        throw new Error(
          `assertDeleted: expected message on "${queueName}" to be deleted, got state=${snap.state} reason=${snap.failedReason ?? 'unknown'}`,
        );
      }
      if (expected?.receiveCount !== undefined && snap.receiveCount !== expected.receiveCount) {
        throw new Error(
          `assertDeleted: expected ${expected.receiveCount} receive(s), observed ${snap.receiveCount}`,
        );
      }
      return snap;
    }) as SQSTestEnv<'mock'>['assertDeleted'],
    assertDeadLettered: (async <TBody>(
      queueName: string,
      expected?: { dlq?: string | undefined; receiveCount?: number | undefined } | undefined,
    ): Promise<SQSMessageSnapshot<TBody>> => {
      const snap = await env.waitForMessage<TBody>(queueName);
      if (snap.state !== 'dead') {
        throw new Error(
          `assertDeadLettered: expected message on "${queueName}" to be dead-lettered, got state=${snap.state}`,
        );
      }
      if (expected?.receiveCount !== undefined && snap.receiveCount !== expected.receiveCount) {
        throw new Error(
          `assertDeadLettered: expected ${expected.receiveCount} receive(s), observed ${snap.receiveCount}`,
        );
      }
      if (expected?.dlq) {
        const dlqEntries = dlqMessages.get(expected.dlq) ?? [];
        const found = dlqEntries.some((entry) => entry.messageId === snap.messageId);
        if (!found) {
          throw new Error(
            `assertDeadLettered: message "${snap.messageId}" was not routed to DLQ "${expected.dlq}"`,
          );
        }
      }
      return snap;
    }) as SQSTestEnv<'mock'>['assertDeadLettered'],
    async assertQueueDrained(queueName?: string | undefined) {
      for (let i = 0; i < 50; i += 1) {
        let pending = 0;
        for (const msg of messages.values()) {
          if (queueName !== undefined && msg.queueName !== queueName) continue;
          if (msg.state === 'pending' || msg.state === 'inflight') pending += 1;
        }
        if (pending === 0) return;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 5);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
      throw new Error(
        `assertQueueDrained: queue${queueName ? ` "${queueName}"` : 's'} still have pending / inflight messages after 250ms`,
      );
    },
    listMessages(queueName?: string | undefined) {
      const out: SQSMessageSnapshot[] = [];
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
      const all: SQSMessageSnapshot[] = [];
      for (const entries of dlqMessages.values()) {
        for (const msg of entries) all.push(snapshotOf(msg));
      }
      return all;
    },
    async stop() {
      stopped = true;
      messages.clear();
      dlqMessages.clear();
      queues.clear();
    },
  };
  return env;
}
