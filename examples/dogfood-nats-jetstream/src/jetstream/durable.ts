/**
 * JetStream durable-consumer flow (v1.31-4) — wraps
 * `@kiwa-lab/streaming`'s `createNatsJetStreamDurable` semantics so the
 * dogfood can exercise ack_wait + max_deliver + backoff behaviour without
 * depending on the real `nats-server` binary.
 *
 * The flow drives a canned scenario mirroring the JetStream durable-consumer
 * retry loop:
 *   1. Publish 4 messages.
 *   2. Deliver all 4 + ack the first + nack the second (triggers backoff).
 *   3. Deliver again — the nacked message reappears after its backoff.
 *   4. Sweep after `ack_wait` elapses — the un-touched message expires and
 *      is either requeued or quarantined.
 *   5. Drive one message past `max_deliver` so it lands in the quarantine
 *      window.
 *
 * The observation reports the counters the dogfood asserts against + the
 * ordered backoff schedule the consumer consumed.
 */

import {
  createNatsJetStreamDurable,
  type DurableConsumerConfig,
  type NatsJetStreamDurable,
} from '@kiwa-lab/streaming';

export interface DurableFlowInput {
  readonly config?: DurableConsumerConfig;
  /** Optional pre-seeded now — tests inject a monotonic clock. */
  readonly nowSeed?: number;
}

export interface DurableFlowResult<TValue = { orderId: string }> {
  readonly durable: NatsJetStreamDurable<TValue>;
  readonly published: number;
  readonly deliveries: number;
  readonly acked: number;
  readonly backoffRedeliveries: number;
  readonly ackWaitSweeps: number;
  readonly quarantined: number;
  readonly ackFloor: number;
  readonly backoffScheduleMs: readonly number[];
}

const DEFAULT_BACKOFF = [50, 200, 800];

/**
 * Drive the canned durable-consumer scenario. Returns the durable handle so
 * the caller can further introspect the ack pending window / quarantine
 * list.
 */
export function driveDurableConsumer(
  input: DurableFlowInput = {},
): DurableFlowResult<{ orderId: string }> {
  const cfg: DurableConsumerConfig = input.config ?? {
    durableName: 'orders-durable',
    ackWaitMs: 100,
    maxDeliver: 2,
    backoff: DEFAULT_BACKOFF,
    filterSubject: 'orders.>',
  };
  const durable = createNatsJetStreamDurable<{ orderId: string }>(cfg);

  // Publish 4 messages onto the stream.
  const seeds: readonly string[] = ['o-1', 'o-2', 'o-3', 'o-4'];
  const published = seeds.map((orderId) =>
    durable.publish({
      topic: 'orders.usd',
      partition: 0,
      timestamp: 0,
      key: null,
      value: { orderId },
      headers: {},
    }),
  );

  let now = input.nowSeed ?? 1_000;
  let deliveries = 0;
  let acked = 0;
  let backoffRedeliveries = 0;
  let ackWaitSweeps = 0;
  const backoffScheduleMs: number[] = [];

  // Step 1: initial delivery of all 4 messages.
  for (let i = 0; i < seeds.length; i += 1) {
    const attempt = durable.deliver(now);
    if (attempt) deliveries += 1;
  }

  // Step 2: ack the first, nack the second (triggers backoff).
  const firstSeq = published[0];
  if (firstSeq !== undefined) {
    durable.ack(firstSeq);
    acked += 1;
  }
  const secondSeq = published[1];
  if (secondSeq !== undefined) {
    now += 10;
    durable.nack(secondSeq, now);
    // Consume 1 backoff slot for the nack path.
    if (cfg.backoff && cfg.backoff.length > 0) {
      backoffScheduleMs.push(cfg.backoff[0] ?? 0);
    }
  }

  // Step 3: advance past the first backoff slot + redeliver.
  const firstBackoff = cfg.backoff?.[0] ?? 0;
  now += firstBackoff + 5;
  const redelivered = durable.deliver(now);
  if (redelivered) {
    backoffRedeliveries += 1;
    deliveries += 1;
    // Ack the redelivered message so it doesn't drift back into ack_wait.
    durable.ack(redelivered.seq);
    acked += 1;
  }

  // Step 4: fast-forward past ack_wait — the un-touched 3rd/4th messages
  // expire and either requeue (deliveries < maxDeliver) or quarantine.
  const ackWaitMs = cfg.ackWaitMs ?? 30_000;
  now += ackWaitMs + 50;
  const sweptSeqs = durable.sweepExpired(now);
  ackWaitSweeps += sweptSeqs.length;

  // Step 5: redeliver + push one message past max_deliver.
  // First redeliver the swept messages once.
  for (let i = 0; i < sweptSeqs.length; i += 1) {
    const attempt = durable.deliver(now);
    if (attempt) deliveries += 1;
  }
  // Nack #3 repeatedly until quarantined.
  const thirdSeq = published[2];
  if (thirdSeq !== undefined) {
    const maxDeliver = cfg.maxDeliver ?? 3;
    for (let attempt = 0; attempt < maxDeliver + 1; attempt += 1) {
      now += 10;
      durable.nack(thirdSeq, now);
      if (cfg.backoff && cfg.backoff.length > 0) {
        const slot = Math.min(attempt, cfg.backoff.length - 1);
        backoffScheduleMs.push(cfg.backoff[slot] ?? 0);
      }
    }
  }

  // Ack the 4th message cleanly so ack floor advances beyond quarantine.
  const fourthSeq = published[3];
  if (fourthSeq !== undefined) {
    durable.ack(fourthSeq);
    acked += 1;
  }

  const quarantined = durable.quarantined().length;
  const info = durable.info();

  return {
    durable,
    published: published.length,
    deliveries,
    acked,
    backoffRedeliveries,
    ackWaitSweeps,
    quarantined,
    ackFloor: info.ackFloor,
    backoffScheduleMs,
  };
}
