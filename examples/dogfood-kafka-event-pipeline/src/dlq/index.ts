/**
 * Kafka DLQ flow — retry policy + poison message quarantine + DLQ topic
 * subscribe. The dogfood defines a poison predicate (payload.valid === false)
 * so the retry loop always fails for those messages and the DLQ collects the
 * quarantined entry after the retry budget is exhausted.
 *
 * A separate consumer subscribes to the DLQ topic so tests can assert that
 * quarantined entries can be replayed once the underlying error is fixed —
 * this is the "DLQ topic subscribe" AC piece.
 */

import type {
  BackoffKind,
  DeadLetterEntry,
  DeadLetterQueue,
  KafkaMock,
  StreamingMessage,
} from '@kiwa-lab/streaming';
import { createDeadLetterQueue } from '@kiwa-lab/streaming';

export interface WorkPayload {
  readonly orderId: string;
  readonly valid: boolean;
}

export interface DlqRunResult {
  readonly outcome: 'handled' | 'quarantined';
  readonly attempts: number;
  readonly quarantinedCount: number;
}

export interface DlqRun {
  readonly dlq: DeadLetterQueue<WorkPayload>;
  readonly handle: (message: StreamingMessage<WorkPayload>) => Promise<DlqRunResult>;
  readonly quarantined: () => readonly DeadLetterEntry<WorkPayload>[];
  readonly reset: () => void;
  readonly publishAndReplayDlq: (
    kafka: KafkaMock,
    ok: (msg: WorkPayload) => boolean,
  ) => Promise<{ readonly published: number; readonly replayed: number }>;
}

export interface DlqRunConfig {
  readonly topic: string;
  readonly maxAttempts: number;
  readonly backoff?: BackoffKind;
  readonly baseDelayMs?: number;
}

/**
 * Build the DLQ run. The handler counts attempts and always fails when the
 * payload is marked invalid. Real handlers would call the business logic and
 * only fail on unrecoverable errors; the poison predicate is what tests
 * assert on.
 */
export function createDlqRun(config: DlqRunConfig): DlqRun {
  let attemptsSeen = 0;
  const dlq = createDeadLetterQueue<WorkPayload>({
    topic: config.topic,
    retryPolicy: {
      maxAttempts: config.maxAttempts,
      ...(config.backoff !== undefined ? { backoff: config.backoff } : {}),
      ...(config.baseDelayMs !== undefined ? { baseDelayMs: config.baseDelayMs } : {}),
    },
    handler: async (msg: StreamingMessage<WorkPayload>) => {
      attemptsSeen += 1;
      if (!msg.value.valid) {
        throw new Error(`poison message: ${msg.value.orderId}`);
      }
    },
  });

  async function handle(message: StreamingMessage<WorkPayload>): Promise<DlqRunResult> {
    attemptsSeen = 0;
    const outcome = await dlq.handle(message);
    return {
      outcome,
      attempts: attemptsSeen,
      quarantinedCount: dlq.quarantined().length,
    };
  }

  async function publishAndReplayDlq(
    kafka: KafkaMock,
    ok: (msg: WorkPayload) => boolean,
  ): Promise<{ readonly published: number; readonly replayed: number }> {
    // Publish every currently quarantined entry back into the DLQ topic then
    // consume through the DLQ topic. A caller-supplied `ok` predicate decides
    // which of them can be replayed (i.e. the fix has landed and the poison
    // predicate is no longer true).
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: dlq.deadLetterTopic, numPartitions: 1 }] });
    await admin.disconnect();

    const producer = kafka.producer();
    await producer.connect();
    const entries = dlq.quarantined();
    for (const entry of entries) {
      // eslint-disable-next-line no-await-in-loop
      await producer.send({
        topic: dlq.deadLetterTopic,
        messages: [
          {
            key: entry.original.value.orderId,
            value: entry.original.value,
            headers: { 'x-quarantine-reason': entry.reason },
          },
        ],
      });
    }
    await producer.disconnect();

    const consumer = kafka.consumer({ groupId: `${dlq.deadLetterTopic}-replay` });
    await consumer.connect();
    await consumer.subscribe({ topics: [dlq.deadLetterTopic], fromBeginning: true });
    const replayed: WorkPayload[] = [];
    await consumer.run({
      autoCommit: true,
      eachMessage: async (message: StreamingMessage<WorkPayload>) => {
        if (ok(message.value)) replayed.push(message.value);
      },
    });
    await consumer.disconnect();
    return { published: entries.length, replayed: replayed.length };
  }

  return {
    dlq,
    handle,
    quarantined: () => dlq.quarantined(),
    reset: () => dlq.reset(),
    publishAndReplayDlq,
  };
}
