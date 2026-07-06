// Consumer lag + telemetry semantics — offset lag + time lag + partition lag
// + high-watermark tracking. Emits the same shape SRE dashboards use: per
// (topic, partition, consumerGroup), we track `logEndOffset` (broker head),
// `committedOffset` (consumer group), `offsetLag` (records behind), and
// `timeLag` (broker head timestamp - last consumed timestamp).
//
// Modeled after Kafka's `kafka.tools.ConsumerGroupCommand --describe` output
// and Redpanda's `rpk group describe`. The model is provider-agnostic — the
// same telemetry surface applies to Kafka / Redpanda / NATS JetStream.

import type { StreamingProvider } from '../types.js';

export const CONSUMER_LAG_TELEMETRY_SYMBOL = Symbol.for(
  'kiwa.streaming.semantics.consumer-lag-telemetry',
);

export interface ConsumerLagTelemetryConfig {
  readonly provider: StreamingProvider;
  /** Refresh interval in ms — throttles snapshot generation. Default 5_000. */
  readonly refreshIntervalMs?: number;
}

export interface OffsetSnapshot {
  readonly topic: string;
  readonly partition: number;
  readonly consumerGroup: string;
  readonly highWatermark: number;
  readonly committedOffset: number;
  readonly offsetLag: number;
  readonly headTimestamp: number;
  readonly lastConsumedTimestamp: number;
  readonly timeLagMs: number;
  readonly capturedAt: number;
}

export interface ConsumerLagTelemetry {
  readonly [CONSUMER_LAG_TELEMETRY_SYMBOL]: true;
  readonly config: Required<ConsumerLagTelemetryConfig>;

  /** Update the broker-side high watermark for a topic-partition. */
  recordHighWatermark(topic: string, partition: number, offset: number, timestamp: number): void;

  /** Update the consumer group's committed offset for a topic-partition. */
  recordCommittedOffset(
    consumerGroup: string,
    topic: string,
    partition: number,
    offset: number,
    timestamp: number,
  ): void;

  /** Capture a snapshot for a single (group, topic, partition). */
  snapshot(input: {
    readonly consumerGroup: string;
    readonly topic: string;
    readonly partition: number;
    readonly now: number;
  }): OffsetSnapshot | null;

  /** Capture snapshots for every (group, topic, partition) known to the telemetry. */
  snapshotAll(now: number): readonly OffsetSnapshot[];

  /** Aggregate lag across all partitions of a topic for a single group. */
  aggregateGroupLag(consumerGroup: string, topic: string, now: number): {
    readonly totalOffsetLag: number;
    readonly maxOffsetLag: number;
    readonly partitionCount: number;
  };

  reset(): void;
}

interface HeadState {
  offset: number;
  timestamp: number;
}

interface CommittedState {
  offset: number;
  timestamp: number;
}

function keyFor(topic: string, partition: number): string {
  return `${topic}::${partition}`;
}

function committedKey(group: string, topic: string, partition: number): string {
  return `${group}::${topic}::${partition}`;
}

/**
 * Create a consumer-lag + telemetry aggregator. Producers call
 * `recordHighWatermark` on each append, consumers call `recordCommittedOffset`
 * on each commit. `snapshot()` returns the pair as a single row — the same
 * shape observability platforms pull off Kafka via JMX exports.
 */
export function createConsumerLagTelemetry(
  config: ConsumerLagTelemetryConfig,
): ConsumerLagTelemetry {
  const cfg: Required<ConsumerLagTelemetryConfig> = {
    provider: config.provider,
    refreshIntervalMs: config.refreshIntervalMs ?? 5_000,
  };
  const heads = new Map<string, HeadState>();
  const committed = new Map<string, CommittedState>();

  const telemetry: ConsumerLagTelemetry = {
    [CONSUMER_LAG_TELEMETRY_SYMBOL]: true,
    config: cfg,
    recordHighWatermark(topic, partition, offset, timestamp): void {
      const existing = heads.get(keyFor(topic, partition));
      if (existing && offset < existing.offset) {
        // Non-monotonic input — HW never regresses. Ignore.
        return;
      }
      heads.set(keyFor(topic, partition), { offset, timestamp });
    },
    recordCommittedOffset(consumerGroup, topic, partition, offset, timestamp): void {
      const key = committedKey(consumerGroup, topic, partition);
      const existing = committed.get(key);
      if (existing && offset < existing.offset) return;
      committed.set(key, { offset, timestamp });
    },
    snapshot({ consumerGroup, topic, partition, now }): OffsetSnapshot | null {
      const head = heads.get(keyFor(topic, partition));
      const commit = committed.get(committedKey(consumerGroup, topic, partition));
      if (!head) return null;
      const committedOffset = commit?.offset ?? 0;
      const offsetLag = Math.max(0, head.offset - committedOffset);
      const lastConsumedTimestamp = commit?.timestamp ?? 0;
      const timeLagMs = lastConsumedTimestamp === 0 ? 0 : Math.max(0, head.timestamp - lastConsumedTimestamp);
      return {
        topic,
        partition,
        consumerGroup,
        highWatermark: head.offset,
        committedOffset,
        offsetLag,
        headTimestamp: head.timestamp,
        lastConsumedTimestamp,
        timeLagMs,
        capturedAt: now,
      };
    },
    snapshotAll(now): readonly OffsetSnapshot[] {
      const out: OffsetSnapshot[] = [];
      // Cross join every known committed key with the matching head. Groups
      // that haven't committed against a partition are surfaced via a zero
      // committedOffset in `snapshot()`.
      for (const key of committed.keys()) {
        const [group, topic, partitionStr] = key.split('::');
        if (!group || !topic || !partitionStr) continue;
        const partition = Number(partitionStr);
        const snap = telemetry.snapshot({ consumerGroup: group, topic, partition, now });
        if (snap) out.push(snap);
      }
      out.sort((a, b) => {
        if (a.consumerGroup !== b.consumerGroup) return a.consumerGroup.localeCompare(b.consumerGroup);
        if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
        return a.partition - b.partition;
      });
      return out;
    },
    aggregateGroupLag(consumerGroup, topic, now) {
      let total = 0;
      let max = 0;
      let partitionCount = 0;
      for (const key of committed.keys()) {
        const [group, tpc] = key.split('::');
        if (group !== consumerGroup || tpc !== topic) continue;
        const snap = telemetry.snapshot({
          consumerGroup,
          topic,
          partition: Number(key.split('::')[2] ?? 0),
          now,
        });
        if (!snap) continue;
        total += snap.offsetLag;
        if (snap.offsetLag > max) max = snap.offsetLag;
        partitionCount += 1;
      }
      return { totalOffsetLag: total, maxOffsetLag: max, partitionCount };
    },
    reset(): void {
      heads.clear();
      committed.clear();
    },
  };
  return telemetry;
}

/** Type guard: recognize a ConsumerLagTelemetry. */
export function isConsumerLagTelemetry(value: unknown): value is ConsumerLagTelemetry {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [CONSUMER_LAG_TELEMETRY_SYMBOL]?: true })[CONSUMER_LAG_TELEMETRY_SYMBOL] === true
  );
}
