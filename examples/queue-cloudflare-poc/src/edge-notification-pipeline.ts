import type {
  CloudflareQueueBatch,
  CloudflareQueueConsumerRegistration,
  CloudflareQueuesTestEnv,
} from '@kiwa/queue';

/**
 * A small edge-runtime notification pipeline stitched together so the PoC can
 * prove the `send → consumer batch → assert` loop end-to-end without booting a
 * real wrangler dev-server.
 *
 * The pipeline models an audit-log fan-out — an upstream webhook lands on the
 * `webhook-events` queue, the consumer batches every message and writes each
 * entry to a downstream audit sink. Transient failures retry via
 * `msg.retry()`; exhausted messages route to the `audit-dlq` queue for later
 * inspection.
 */
export interface WebhookEvent {
  eventId: string;
  actor: string;
  kind: 'created' | 'updated' | 'deleted';
}

export interface AuditSink {
  entries: WebhookEvent[];
  transientFailuresRemaining: number;
  hardFailureFor: Set<string>;
  write: (event: WebhookEvent) => Promise<void>;
}

export function createAuditSink(opts?: {
  transientFailures?: number | undefined;
  hardFailureFor?: string[] | undefined;
}): AuditSink {
  const entries: AuditSink['entries'] = [];
  const hardFailures = new Set<string>(opts?.hardFailureFor ?? []);
  const sink: AuditSink = {
    entries,
    transientFailuresRemaining: opts?.transientFailures ?? 0,
    hardFailureFor: hardFailures,
    async write(event) {
      // Hard failures never recover — mirrors a downstream service that has
      // permanently gone away. Those messages should DLQ once retries exhaust.
      if (hardFailures.has(event.eventId)) {
        throw new Error(`audit sink permanently rejects ${event.eventId}`);
      }
      // Transient failures thin out as they burn attempts.
      if (sink.transientFailuresRemaining > 0) {
        sink.transientFailuresRemaining -= 1;
        throw new Error(`audit sink transient failure for ${event.eventId}`);
      }
      entries.push(event);
    },
  };
  return sink;
}

/**
 * Build the audit-write consumer registration. Kept as a factory so tests can
 * inject different sinks + retry policies.
 */
export function createAuditConsumer(
  sink: AuditSink,
  opts?: { maxRetries?: number | undefined; deadLetterQueue?: string | undefined },
): CloudflareQueueConsumerRegistration<WebhookEvent> {
  const registration: CloudflareQueueConsumerRegistration<WebhookEvent> = {
    queue: 'webhook-events',
    maxBatchSize: 10,
    maxRetries: opts?.maxRetries ?? 3,
    handler: async (batch: CloudflareQueueBatch<WebhookEvent>) => {
      for (const msg of batch.messages) {
        try {
          await sink.write(msg.body);
          msg.ack();
        } catch {
          // Signal the runtime to redeliver this specific message. Other
          // messages in the batch are ack'd independently so partial success
          // is preserved — matches Cloudflare Queues production behaviour.
          msg.retry();
        }
      }
    },
  };
  if (opts?.deadLetterQueue !== undefined) {
    registration.deadLetterQueue = opts.deadLetterQueue;
  }
  return registration;
}

/**
 * Convenience helper — register the audit consumer on an env with a fresh
 * sink. Returns the sink so tests can inspect its post-run state.
 */
export function attachEdgeAuditPipeline(
  env: CloudflareQueuesTestEnv,
  opts?: {
    transientFailures?: number | undefined;
    hardFailureFor?: string[] | undefined;
    maxRetries?: number | undefined;
    deadLetterQueue?: string | undefined;
  },
): AuditSink {
  const sink = createAuditSink({
    ...(opts?.transientFailures !== undefined ? { transientFailures: opts.transientFailures } : {}),
    ...(opts?.hardFailureFor !== undefined ? { hardFailureFor: opts.hardFailureFor } : {}),
  });
  env.registerConsumer(
    createAuditConsumer(sink, {
      ...(opts?.maxRetries !== undefined ? { maxRetries: opts.maxRetries } : {}),
      ...(opts?.deadLetterQueue !== undefined ? { deadLetterQueue: opts.deadLetterQueue } : {}),
    }),
  );
  return sink;
}
