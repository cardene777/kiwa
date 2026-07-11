import type {
  QueueClient,
  QueueHandler,
  QueueMessage,
  QueueTestEnv,
  SetupQueueEnvOptions,
} from './types.js';

const DEFAULT_MAX_RECEIVE_COUNT = 5;

interface QueueEntry<T> {
  id: string;
  body: T;
  receivedCount: number;
  dedupKey?: string;
}

class InMemoryQueue<T> implements QueueClient<T> {
  private readonly queue: QueueEntry<T>[] = [];
  private readonly dlq: QueueEntry<T>[] = [];
  private readonly dedupIndex = new Set<string>();
  private nextId = 1;
  private readonly maxReceiveCount: number;
  private readonly consumers = new Set<QueueHandler<T>>();
  private dispatching = false;

  constructor(maxReceiveCount: number) {
    this.maxReceiveCount = maxReceiveCount;
  }

  send(body: T, opts: { dedupKey?: string } = {}): string {
    if (opts.dedupKey && this.dedupIndex.has(opts.dedupKey)) {
      const existing = this.queue.find((e) => e.dedupKey === opts.dedupKey);
      if (existing) return existing.id;
    }
    const id = String(this.nextId++);
    const entry: QueueEntry<T> = { id, body, receivedCount: 0 };
    if (opts.dedupKey) {
      entry.dedupKey = opts.dedupKey;
      this.dedupIndex.add(opts.dedupKey);
    }
    this.queue.push(entry);
    void this.dispatch();
    return id;
  }

  receive(): QueueMessage<T> | null {
    const entry = this.queue.shift();
    if (!entry) return null;
    entry.receivedCount += 1;
    return this.toMessage(entry);
  }

  consume(handler: QueueHandler<T>): () => void {
    this.consumers.add(handler);
    void this.dispatch();
    return () => {
      this.consumers.delete(handler);
    };
  }

  size(): number {
    return this.queue.length;
  }

  dlqSize(): number {
    return this.dlq.length;
  }

  drainDlq(): QueueMessage<T>[] {
    const out = this.dlq.map((e) => this.toMessage(e));
    this.dlq.length = 0;
    return out;
  }

  private toMessage(entry: QueueEntry<T>): QueueMessage<T> {
    const message: QueueMessage<T> = {
      id: entry.id,
      body: entry.body,
      receivedCount: entry.receivedCount,
    };
    if (entry.dedupKey) message.dedupKey = entry.dedupKey;
    return message;
  }

  private async dispatch(): Promise<void> {
    if (this.dispatching) return;
    this.dispatching = true;
    try {
      while (this.queue.length > 0 && this.consumers.size > 0) {
        // The `queue.length > 0` guard above guarantees `shift()` returns an
        // entry. The old `if (!entry) break` was a defensive check for a
        // state the loop condition already rules out, and its arm sat in the
        // branch report as unreachable.
        const entry = this.queue.shift() as QueueEntry<T>;
        entry.receivedCount += 1;
        const message = this.toMessage(entry);
        let acked = false;
        let nacked = false;
        const handle = {
          ack: () => {
            acked = true;
          },
          nack: () => {
            nacked = true;
          },
        };
        for (const handler of this.consumers) {
          await handler(message, handle);
          if (acked || nacked) break;
        }
        if (acked) {
          if (entry.dedupKey) this.dedupIndex.delete(entry.dedupKey);
          continue;
        }
        if (entry.receivedCount >= this.maxReceiveCount) {
          this.dlq.push(entry);
          if (entry.dedupKey) this.dedupIndex.delete(entry.dedupKey);
        } else {
          this.queue.push(entry);
        }
      }
    } finally {
      this.dispatching = false;
    }
  }
}

export async function setupQueueEnv<T = unknown>(
  opts: SetupQueueEnvOptions<T>,
): Promise<QueueTestEnv<T>> {
  if (opts.mode !== 'mock' && opts.mode !== 'live') {
    throw new Error(`setupQueueEnv: mode must be "mock" or "live", got ${String(opts.mode)}`);
  }
  const maxReceiveCount = opts.maxReceiveCount ?? DEFAULT_MAX_RECEIVE_COUNT;
  const client = new InMemoryQueue<T>(maxReceiveCount);
  if (opts.seed) {
    for (const body of opts.seed) client.send(body);
  }
  const env: QueueTestEnv<T> = {
    mode: opts.mode,
    client,
    stop: async () => undefined,
  };
  return env;
}
