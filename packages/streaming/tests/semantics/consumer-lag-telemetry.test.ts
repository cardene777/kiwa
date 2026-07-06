import { describe, expect, it } from 'vitest';
import {
  createConsumerLagTelemetry,
  isConsumerLagTelemetry,
} from '../../src/index.js';

describe('createConsumerLagTelemetry', () => {
  it('T-CLT-001 snapshot returns null before high watermark is recorded', () => {
    const t = createConsumerLagTelemetry({ provider: 'kafka' });
    expect(isConsumerLagTelemetry(t)).toBe(true);
    const snap = t.snapshot({ consumerGroup: 'g', topic: 't', partition: 0, now: 0 });
    expect(snap).toBeNull();
  });

  it('T-CLT-002 offsetLag = highWatermark - committedOffset', () => {
    const t = createConsumerLagTelemetry({ provider: 'kafka' });
    t.recordHighWatermark('t', 0, 100, 5000);
    t.recordCommittedOffset('g', 't', 0, 40, 3000);
    const snap = t.snapshot({ consumerGroup: 'g', topic: 't', partition: 0, now: 10_000 });
    expect(snap?.offsetLag).toBe(60);
    expect(snap?.timeLagMs).toBe(2000);
  });

  it('T-CLT-003 recordHighWatermark rejects offset regression', () => {
    const t = createConsumerLagTelemetry({ provider: 'kafka' });
    t.recordHighWatermark('t', 0, 100, 5000);
    t.recordHighWatermark('t', 0, 50, 6000);
    const snap = t.snapshot({ consumerGroup: 'g', topic: 't', partition: 0, now: 0 });
    // Committed defaults to 0 for a group that hasn't committed against this partition yet.
    expect(snap?.highWatermark).toBe(100);
  });

  it('T-CLT-004 recordCommittedOffset ignores regressions', () => {
    const t = createConsumerLagTelemetry({ provider: 'kafka' });
    t.recordHighWatermark('t', 0, 100, 5000);
    t.recordCommittedOffset('g', 't', 0, 60, 4000);
    t.recordCommittedOffset('g', 't', 0, 30, 5000);
    const snap = t.snapshot({ consumerGroup: 'g', topic: 't', partition: 0, now: 0 });
    expect(snap?.committedOffset).toBe(60);
  });

  it('T-CLT-005 snapshotAll returns rows sorted by group / topic / partition', () => {
    const t = createConsumerLagTelemetry({ provider: 'redpanda' });
    t.recordHighWatermark('a', 0, 10, 100);
    t.recordHighWatermark('a', 1, 20, 200);
    t.recordHighWatermark('b', 0, 30, 300);
    t.recordCommittedOffset('g', 'a', 0, 5, 100);
    t.recordCommittedOffset('g', 'a', 1, 10, 200);
    t.recordCommittedOffset('g', 'b', 0, 0, 0);
    const snaps = t.snapshotAll(1000);
    expect(snaps.map((s) => `${s.topic}::${s.partition}`)).toEqual(['a::0', 'a::1', 'b::0']);
  });

  it('T-CLT-006 aggregateGroupLag totals lag across partitions', () => {
    const t = createConsumerLagTelemetry({ provider: 'nats' });
    t.recordHighWatermark('a', 0, 100, 1);
    t.recordHighWatermark('a', 1, 200, 2);
    t.recordHighWatermark('a', 2, 50, 3);
    t.recordCommittedOffset('g', 'a', 0, 40, 1);
    t.recordCommittedOffset('g', 'a', 1, 100, 2);
    t.recordCommittedOffset('g', 'a', 2, 50, 3);
    const agg = t.aggregateGroupLag('g', 'a', 100);
    expect(agg.totalOffsetLag).toBe(160);
    expect(agg.maxOffsetLag).toBe(100);
    expect(agg.partitionCount).toBe(3);
  });
});
