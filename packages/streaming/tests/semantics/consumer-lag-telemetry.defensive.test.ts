import { describe, expect, it } from 'vitest';
import { createConsumerLagTelemetry } from '../../src/index.js';

// Follow-up file — closes the remaining defensive branches in
// consumer-lag-telemetry.js: the empty-group-key skip in snapshotAll (line 78),
// the per-group sort comparator (line 86), and the aggregateGroupLag path
// that hits `snap === null` because a committed offset exists without a
// matching high-watermark (lines 107-108).
//
// Complements consumer-lag-telemetry.branches.test.ts (T-CLT-B-001..003).

describe('createConsumerLagTelemetry defensive guards', () => {
  it('T-CLT-B-004 snapshotAll skips committed keys with empty group segments', () => {
    const t = createConsumerLagTelemetry({ provider: 'kafka' });
    t.recordHighWatermark('t', 0, 100, 5);
    // Empty consumer group name → committedKey('', 't', 0) = '::t::0' →
    // split('::') = ['', 't', '0'] → falsy first segment → skipped.
    t.recordCommittedOffset('', 't', 0, 40, 3);
    // Add a valid group so we can confirm the good row survives.
    t.recordCommittedOffset('g1', 't', 0, 40, 3);
    const rows = t.snapshotAll(1000);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.consumerGroup).toBe('g1');
  });

  it('T-CLT-B-005 snapshotAll sort comparator orders rows across consumer groups', () => {
    const t = createConsumerLagTelemetry({ provider: 'kafka' });
    t.recordHighWatermark('t', 0, 100, 5);
    t.recordHighWatermark('t', 1, 100, 5);
    // Insert the "later" group first so the sort must reorder.
    t.recordCommittedOffset('groupZ', 't', 1, 20, 3);
    t.recordCommittedOffset('groupA', 't', 0, 40, 3);
    const rows = t.snapshotAll(1000);
    expect(rows.map((r) => r.consumerGroup)).toEqual(['groupA', 'groupZ']);
  });

  it('T-CLT-B-006 snapshotAll sort comparator orders rows across topics for the same group', () => {
    const t = createConsumerLagTelemetry({ provider: 'redpanda' });
    t.recordHighWatermark('topicB', 0, 100, 5);
    t.recordHighWatermark('topicA', 0, 100, 5);
    t.recordCommittedOffset('g', 'topicB', 0, 20, 3);
    t.recordCommittedOffset('g', 'topicA', 0, 40, 3);
    const rows = t.snapshotAll(1000);
    expect(rows.map((r) => r.topic)).toEqual(['topicA', 'topicB']);
  });

  it('T-CLT-B-007 aggregateGroupLag skips committed keys whose high-watermark is missing', () => {
    const t = createConsumerLagTelemetry({ provider: 'nats' });
    // Two partitions committed, only one has a matching HW.
    t.recordHighWatermark('t', 0, 100, 5);
    t.recordCommittedOffset('g', 't', 0, 10, 3);
    t.recordCommittedOffset('g', 't', 1, 20, 3);
    const agg = t.aggregateGroupLag('g', 't', 1000);
    // Partition 1 short-circuits the `snap === null` branch and is excluded.
    expect(agg.partitionCount).toBe(1);
    expect(agg.totalOffsetLag).toBe(90);
  });
});
