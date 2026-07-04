// Dead-letter queue (DLQ) test adapter — wraps a message handler with a retry
// budget + backoff policy. When the budget is exhausted the message is
// quarantined into a per-DLQ topic that tests can inspect.
//
// The retry model is provider-neutral: it operates on `StreamingMessage`
// objects so the same DLQ can wrap Kafka / Redpanda / NATS consumer output.

import type { DeadLetterEntry, MessageHandler, StreamingMessage } from './types.js';

export const DLQ_SYMBOL = Symbol.for('kiwa.streaming.dlq');

export type BackoffKind = 'constant' | 'linear' | 'exponential';

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoff?: BackoffKind;
  /** Backoff base in ms — constant returns this, linear multiplies by attempt, exponential = base * 2^(attempt-1). */
  readonly baseDelayMs?: number;
  /** Cap the backoff delay so retries don't stall long-running tests. */
  readonly maxDelayMs?: number;
}

export interface DeadLetterQueueConfig<TValue = unknown, TKey = string> {
  readonly topic: string;
  readonly handler: MessageHandler<TValue, TKey>;
  readonly retryPolicy: RetryPolicy;
  /** Optional callback that receives every quarantined entry — useful for alert wiring. */
  readonly onDeadLetter?: (entry: DeadLetterEntry<TValue, TKey>) => void;
}

export interface DeadLetterQueue<TValue = unknown, TKey = string> {
  readonly [DLQ_SYMBOL]: true;
  readonly topic: string;
  readonly deadLetterTopic: string;
  /** Process one message through the retry + quarantine chain. */
  handle(message: StreamingMessage<TValue, TKey>): Promise<'handled' | 'quarantined'>;
  /** Immutable snapshot of currently quarantined entries. */
  quarantined(): readonly DeadLetterEntry<TValue, TKey>[];
  /** Manually enqueue an entry into the DLQ (useful for injecting fixtures). */
  quarantine(entry: DeadLetterEntry<TValue, TKey>): void;
  reset(): void;
}

/**
 * Create a DLQ-aware handler. Each incoming message is invoked against
 * `handler`; on error, the message is re-tried up to `retryPolicy.maxAttempts`
 * total attempts. When the budget is exhausted, the message is quarantined
 * with the last error message + attempt count.
 */
export function createDeadLetterQueue<TValue = unknown, TKey = string>(
  config: DeadLetterQueueConfig<TValue, TKey>,
): DeadLetterQueue<TValue, TKey> {
  if (config.retryPolicy.maxAttempts < 1) {
    throw new Error('DLQ: maxAttempts must be >= 1');
  }
  const quarantined: DeadLetterEntry<TValue, TKey>[] = [];
  const deadLetterTopic = `${config.topic}.dlq`;

  async function delayFor(attempt: number): Promise<void> {
    const kind = config.retryPolicy.backoff ?? 'constant';
    const base = config.retryPolicy.baseDelayMs ?? 0;
    if (base === 0) return;
    let ms: number;
    if (kind === 'constant') ms = base;
    else if (kind === 'linear') ms = base * attempt;
    else ms = base * Math.pow(2, attempt - 1);
    const cap = config.retryPolicy.maxDelayMs ?? ms;
    ms = Math.min(ms, cap);
    if (ms <= 0) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);
      (timer as unknown as { unref?: () => void }).unref?.();
    });
  }

  const dlq: DeadLetterQueue<TValue, TKey> = {
    [DLQ_SYMBOL]: true,
    topic: config.topic,
    deadLetterTopic,
    async handle(message: StreamingMessage<TValue, TKey>): Promise<'handled' | 'quarantined'> {
      let lastError = '';
      for (let attempt = 1; attempt <= config.retryPolicy.maxAttempts; attempt += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await config.handler(message);
          return 'handled';
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          if (attempt < config.retryPolicy.maxAttempts) {
            // eslint-disable-next-line no-await-in-loop
            await delayFor(attempt);
          }
        }
      }
      const entry: DeadLetterEntry<TValue, TKey> = {
        original: message,
        attempts: config.retryPolicy.maxAttempts,
        reason: lastError,
        quarantinedAt: Date.now(),
      };
      quarantined.push(entry);
      if (config.onDeadLetter) config.onDeadLetter(entry);
      return 'quarantined';
    },
    quarantined(): readonly DeadLetterEntry<TValue, TKey>[] {
      return [...quarantined];
    },
    quarantine(entry: DeadLetterEntry<TValue, TKey>): void {
      quarantined.push(entry);
      if (config.onDeadLetter) config.onDeadLetter(entry);
    },
    reset(): void {
      quarantined.length = 0;
    },
  };
  return dlq;
}

/** Type guard: recognize a DeadLetterQueue. */
export function isDeadLetterQueue(value: unknown): value is DeadLetterQueue {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [DLQ_SYMBOL]?: true })[DLQ_SYMBOL] === true
  );
}
