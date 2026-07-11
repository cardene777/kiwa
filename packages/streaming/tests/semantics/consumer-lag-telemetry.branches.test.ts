import { describe, expect, it } from 'vitest';
import { createConsumerLagTelemetry } from '../../src/index.js';

// Follow-up file — covers reset(), aggregateGroupLag scoping (mismatched
// group / topic filter), snapshot with committed but no head, and the
// timeLagMs=0 short-circuit that T-CLT-* doesn't reach.

describe('createConsumerLagTelemetry state guards', () => {
  it('T-CLT-B-001 reset clears heads and committed offsets', () => {
    const t = createConsumerLagTelemetry({ provider: 'kafka' });
    t.recordHighWatermark('t', 0, 100, 5000);
    t.recordCommittedOffset('g', 't', 0, 40, 3000);
    t.reset();
    // After reset, snapshot returns null because no head is recorded.
    expect(t.snapshot({ consumerGroup: 'g', topic: 't', partition: 0, now: 0 })).toBeNull();
    expect(t.snapshotAll(0)).toEqual([]);
    expect(t.aggregateGroupLag('g', 't', 0)).toEqual({
      totalOffsetLag: 0,
      maxOffsetLag: 0,
      partitionCount: 0,
    });
  });

  it('T-CLT-B-002 timeLagMs is 0 when the group has never committed', () => {
    const t = createConsumerLagTelemetry({ provider: 'redpanda' });
    t.recordHighWatermark('t', 0, 100, 5000);
    const snap = t.snapshot({ consumerGroup: 'g', topic: 't', partition: 0, now: 10_000 });
    // lastConsumedTimestamp defaults to 0 → timeLagMs short-circuits to 0
    // even though head.timestamp > 0.
    expect(snap?.timeLagMs).toBe(0);
    expect(snap?.lastConsumedTimestamp).toBe(0);
  });

  it('T-CLT-B-003 aggregateGroupLag scoping ignores unrelated group / topic keys', () => {
    const t = createConsumerLagTelemetry({ provider: 'nats' });
    t.recordHighWatermark('a', 0, 100, 1);
    t.recordHighWatermark('b', 0, 200, 1);
    t.recordCommittedOffset('g1', 'a', 0, 10, 1);
    t.recordCommittedOffset('g1', 'b', 0, 50, 1);
    t.recordCommittedOffset('g2', 'a', 0, 20, 1);
    const agg = t.aggregateGroupLag('g1', 'a', 100);
    expect(agg.partitionCount).toBe(1);
    expect(agg.totalOffsetLag).toBe(90);
    expect(agg.maxOffsetLag).toBe(90);
  });
});
