import type { SQSTestEnv, SQSReceivedMessage } from '@kiwa-test/queue';

/**
 * A small customer-order processing pipeline stitched together so the PoC
 * proves the `send → receive → delete → DLQ` loop end-to-end without booting
 * a real LocalStack container.
 *
 * The pipeline models a payment charge fan-out — an upstream order-placed
 * event lands on the `orders` queue, the consumer receives a batch and
 * writes each entry to a downstream billing sink. Transient failures leave
 * the message inflight so the visibility timeout expires and the message is
 * redelivered. Persistent failures exceed `maxReceiveCount` and route to
 * `orders-dlq` for later inspection.
 */
export interface OrderEvent {
  orderId: string;
  amount: number;
  customer: string;
}

export interface BillingSink {
  charges: OrderEvent[];
  transientFailuresRemaining: number;
  hardFailureFor: Set<string>;
  charge: (event: OrderEvent) => Promise<void>;
}

export function createBillingSink(opts?: {
  transientFailures?: number | undefined;
  hardFailureFor?: string[] | undefined;
}): BillingSink {
  const charges: BillingSink['charges'] = [];
  const hardFailures = new Set<string>(opts?.hardFailureFor ?? []);
  const sink: BillingSink = {
    charges,
    transientFailuresRemaining: opts?.transientFailures ?? 0,
    hardFailureFor: hardFailures,
    async charge(event) {
      if (hardFailures.has(event.orderId)) {
        throw new Error(`billing sink permanently rejects ${event.orderId}`);
      }
      if (sink.transientFailuresRemaining > 0) {
        sink.transientFailuresRemaining -= 1;
        throw new Error(`billing sink transient failure for ${event.orderId}`);
      }
      charges.push(event);
    },
  };
  return sink;
}

/**
 * Drain one batch — receive up to `maxMessages`, run the handler for each,
 * and either delete on success or leave the message inflight for
 * visibility-timeout redelivery. Returns the number of messages the
 * handler processed (regardless of outcome).
 */
export async function drainBatch(
  env: SQSTestEnv,
  queueName: string,
  sink: BillingSink,
  opts?: { maxMessages?: number | undefined; visibilityTimeoutSeconds?: number | undefined },
): Promise<number> {
  const received = await env.receive<OrderEvent>(queueName, {
    maxMessages: opts?.maxMessages ?? 10,
    ...(opts?.visibilityTimeoutSeconds !== undefined
      ? { visibilityTimeoutSeconds: opts.visibilityTimeoutSeconds }
      : {}),
  });
  for (const msg of received) {
    try {
      await sink.charge(msg.body);
      msg.delete();
    } catch {
      // Leave inflight — visibility timeout will re-queue for another attempt.
      // If receiveCount exceeds maxReceiveCount the queue routes to DLQ.
    }
  }
  return received.length;
}

/**
 * Convenience — repeatedly drain a queue until either all messages reach a
 * terminal state (deleted / dead) or the timeout expires. Handy for tests
 * that need a runtime-like "keep polling" loop without spinning a real
 * worker.
 */
export async function drainQueue(
  env: SQSTestEnv,
  queueName: string,
  sink: BillingSink,
  opts?: {
    maxIterations?: number | undefined;
    visibilityTimeoutSeconds?: number | undefined;
    pollIntervalMs?: number | undefined;
  },
): Promise<void> {
  const maxIterations = opts?.maxIterations ?? 20;
  const pollIntervalMs = opts?.pollIntervalMs ?? 50;
  for (let i = 0; i < maxIterations; i += 1) {
    const drained = await drainBatch(env, queueName, sink, {
      ...(opts?.visibilityTimeoutSeconds !== undefined
        ? { visibilityTimeoutSeconds: opts.visibilityTimeoutSeconds }
        : {}),
    });
    const messages = env.listMessages(queueName);
    const terminalStates = messages.filter(
      (m) => m.state === 'deleted' || m.state === 'dead',
    ).length;
    if (drained === 0 && terminalStates === messages.length) return;
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
}

/**
 * A tiny FIFO order-shipping stub — receives messages in a FIFO queue, keeps
 * per-group ordering, and returns the observed sequence for assertion.
 */
export async function collectFifoDeliveries(
  env: SQSTestEnv,
  queueName: string,
): Promise<{ groupId: string; orderId: string }[]> {
  const out: { groupId: string; orderId: string }[] = [];
  // Drain until empty.
  for (let i = 0; i < 20; i += 1) {
    const received: SQSReceivedMessage<OrderEvent>[] = await env.receive<OrderEvent>(
      queueName,
      { maxMessages: 10 },
    );
    if (received.length === 0) return out;
    for (const msg of received) {
      out.push({
        groupId: msg.messageGroupId ?? '',
        orderId: msg.body.orderId,
      });
      msg.delete();
    }
  }
  return out;
}
