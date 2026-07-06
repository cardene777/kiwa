// NATS JetStream durable-consumer semantics — durable consumer + ack pending
// window + max deliver limit + backoff schedule. Models the pieces of a
// durable JetStream consumer that show up in retry / DLQ tests, without
// spinning up the real `nats-server` binary.
//
// Modeled after the `ConsumerConfig` shape in nats.js — `durable_name`,
// `ack_wait`, `max_deliver`, `backoff[]`, `ack_policy` — and the ack-tracking
// state kept on the broker side.

import type { StreamingMessage } from '../types.js';

export const NATS_JETSTREAM_DURABLE_SYMBOL = Symbol.for(
  'kiwa.streaming.semantics.nats-jetstream-durable',
);

export type AckPolicy = 'explicit' | 'all' | 'none';

export interface DurableConsumerConfig {
  readonly durableName: string;
  readonly filterSubject?: string;
  /** ack_wait — after this many ms with no ack, the message is redelivered. Default 30_000. */
  readonly ackWaitMs?: number;
  /** max_deliver — total delivery attempts before quarantine. Default 3. */
  readonly maxDeliver?: number;
  readonly ackPolicy?: AckPolicy;
  /**
   * backoff schedule (ms) — delay between redelivery attempts. When exhausted,
   * the last entry is used for further redeliveries. Empty ⇒ immediate.
   */
  readonly backoff?: readonly number[];
}

export interface DeliveryAttempt<TValue = unknown> {
  readonly seq: number;
  readonly attempt: number;
  readonly deliveredAt: number;
  readonly message: StreamingMessage<TValue>;
}

export interface AckPendingEntry {
  readonly seq: number;
  readonly deliveries: number;
  readonly lastDeliveredAt: number;
}

export interface QuarantinedMessage<TValue = unknown> {
  readonly seq: number;
  readonly attempts: number;
  readonly message: StreamingMessage<TValue>;
  readonly reason: string;
}

export interface NatsJetStreamDurable<TValue = unknown> {
  readonly [NATS_JETSTREAM_DURABLE_SYMBOL]: true;
  readonly config: Required<
    Pick<DurableConsumerConfig, 'durableName' | 'ackWaitMs' | 'maxDeliver' | 'ackPolicy'>
  > & { readonly backoff: readonly number[]; readonly filterSubject: string | undefined };

  /** Enqueue a fresh message onto the stream. Returns the assigned seq. */
  publish(message: Omit<StreamingMessage<TValue>, 'offset'> & { readonly subject?: string }): number;

  /** Deliver the next unacked / pending message to the consumer. */
  deliver(now: number): DeliveryAttempt<TValue> | null;

  /** Ack a delivered message by seq — marks it done. */
  ack(seq: number): void;

  /** Nack — mark the delivery failed. Redelivered on next `deliver()` respecting backoff. */
  nack(seq: number, now: number): void;

  /**
   * Sweep — advance any pending deliveries whose `ack_wait` has elapsed. This
   * is what real JetStream does on a timer; tests drive it explicitly.
   */
  sweepExpired(now: number): readonly number[];

  /** Current ack-pending window (seq → deliveries + lastDeliveredAt). */
  ackPending(): readonly AckPendingEntry[];

  /** Messages that exceeded `maxDeliver` and were quarantined. */
  quarantined(): readonly QuarantinedMessage<TValue>[];

  info(): { readonly delivered: number; readonly ackFloor: number; readonly pending: number };

  reset(): void;
}

interface InternalPending {
  seq: number;
  deliveries: number;
  lastDeliveredAt: number;
  nextEligibleAt: number;
  message: StreamingMessage<unknown>;
}

/**
 * Create a durable-consumer model. `deliver(now)` picks the next eligible
 * message (either a new one or a redelivery whose backoff has elapsed) and
 * increments its attempt count. On the `maxDeliver`+1st failure, the message
 * is quarantined for inspection.
 */
export function createNatsJetStreamDurable<TValue = unknown>(
  config: DurableConsumerConfig,
): NatsJetStreamDurable<TValue> {
  const cfg = {
    durableName: config.durableName,
    ackWaitMs: config.ackWaitMs ?? 30_000,
    maxDeliver: config.maxDeliver ?? 3,
    ackPolicy: config.ackPolicy ?? ('explicit' as AckPolicy),
    backoff: config.backoff ? [...config.backoff] : [],
    filterSubject: config.filterSubject,
  } as const;

  const stream: StreamingMessage<unknown>[] = [];
  const pending = new Map<number, InternalPending>();
  const quarantined: QuarantinedMessage<TValue>[] = [];
  let nextSeq = 1;
  let ackFloor = 0;
  let deliveredCount = 0;

  function eligibleForRedelivery(entry: InternalPending, now: number): boolean {
    if (entry.deliveries === 0) return true;
    return now >= entry.nextEligibleAt;
  }

  function pickBackoff(attempt: number): number {
    if (cfg.backoff.length === 0) return 0;
    const index = Math.min(attempt - 1, cfg.backoff.length - 1);
    return cfg.backoff[index] ?? 0;
  }

  const durable: NatsJetStreamDurable<TValue> = {
    [NATS_JETSTREAM_DURABLE_SYMBOL]: true,
    config: cfg,
    publish(message): number {
      const seq = nextSeq++;
      const full: StreamingMessage<unknown> = {
        topic: message.topic ?? cfg.filterSubject ?? cfg.durableName,
        partition: message.partition ?? 0,
        offset: seq,
        timestamp: message.timestamp ?? Date.now(),
        key: message.key ?? null,
        value: message.value as unknown,
        headers: message.headers ?? {},
      };
      stream.push(full);
      pending.set(seq, {
        seq,
        deliveries: 0,
        lastDeliveredAt: 0,
        nextEligibleAt: 0,
        message: full,
      });
      return seq;
    },
    deliver(now): DeliveryAttempt<TValue> | null {
      const sorted = [...pending.values()].sort((a, b) => a.seq - b.seq);
      for (const entry of sorted) {
        if (!eligibleForRedelivery(entry, now)) continue;
        entry.deliveries += 1;
        entry.lastDeliveredAt = now;
        entry.nextEligibleAt = now + cfg.ackWaitMs;
        deliveredCount += 1;
        return {
          seq: entry.seq,
          attempt: entry.deliveries,
          deliveredAt: now,
          message: entry.message as StreamingMessage<TValue>,
        };
      }
      return null;
    },
    ack(seq): void {
      const entry = pending.get(seq);
      if (!entry) return;
      pending.delete(seq);
      if (cfg.ackPolicy === 'all') {
        // ack_policy=all — acking N implicitly acks 1..N.
        for (const s of [...pending.keys()]) {
          if (s <= seq) pending.delete(s);
        }
      }
      if (seq > ackFloor) ackFloor = seq;
    },
    nack(seq, now): void {
      const entry = pending.get(seq);
      if (!entry) return;
      if (entry.deliveries >= cfg.maxDeliver) {
        pending.delete(seq);
        quarantined.push({
          seq,
          attempts: entry.deliveries,
          message: entry.message as StreamingMessage<TValue>,
          reason: `exceeded max_deliver=${cfg.maxDeliver}`,
        });
        return;
      }
      const delay = pickBackoff(entry.deliveries);
      entry.nextEligibleAt = now + delay;
    },
    sweepExpired(now): readonly number[] {
      const expired: number[] = [];
      for (const entry of pending.values()) {
        if (entry.deliveries === 0) continue;
        if (now - entry.lastDeliveredAt < cfg.ackWaitMs) continue;
        if (entry.deliveries >= cfg.maxDeliver) {
          quarantined.push({
            seq: entry.seq,
            attempts: entry.deliveries,
            message: entry.message as StreamingMessage<TValue>,
            reason: `exceeded max_deliver=${cfg.maxDeliver} via ack_wait sweep`,
          });
          pending.delete(entry.seq);
          expired.push(entry.seq);
          continue;
        }
        // Requeue by resetting eligibility to now (immediate redelivery).
        entry.nextEligibleAt = now;
        expired.push(entry.seq);
      }
      return expired;
    },
    ackPending(): readonly AckPendingEntry[] {
      return [...pending.values()]
        .sort((a, b) => a.seq - b.seq)
        .map((e) => ({ seq: e.seq, deliveries: e.deliveries, lastDeliveredAt: e.lastDeliveredAt }));
    },
    quarantined(): readonly QuarantinedMessage<TValue>[] {
      return [...quarantined];
    },
    info() {
      return { delivered: deliveredCount, ackFloor, pending: pending.size };
    },
    reset(): void {
      stream.length = 0;
      pending.clear();
      quarantined.length = 0;
      nextSeq = 1;
      ackFloor = 0;
      deliveredCount = 0;
    },
  };
  return durable;
}

/** Type guard: recognize a NatsJetStreamDurable. */
export function isNatsJetStreamDurable(value: unknown): value is NatsJetStreamDurable<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [NATS_JETSTREAM_DURABLE_SYMBOL]?: true })[NATS_JETSTREAM_DURABLE_SYMBOL] === true
  );
}
