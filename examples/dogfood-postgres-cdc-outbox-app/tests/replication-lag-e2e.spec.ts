import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveReplicationFlow } from '../src/flows/postgres-flows.js';

describe('streaming replication — primary write + read replica lag + failover', () => {
  it('T-DPR-001 primary write advances primaryLsn by the sum of every batch', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveReplication({
      writes: [{ bytes: 100 }, { bytes: 250 }, { bytes: 400 }],
      laggedReplicaId: 'replica-a',
      laggedAppliedLsn: 200,
      failoverReason: 'unit-test',
      promoteReplicaId: 'replica-b',
    });
    expect(out.primaryLsn).toBe(750);
    expect(out.failoverState).toBe('promoted');
    await adapter.reset();
  });

  it('T-DPR-002 markReplicaLagged records the exact lag between primary + replica', async () => {
    const adapter = makeMockAdapter();
    const out = await driveReplicationFlow(adapter, {
      writes: [{ bytes: 500 }],
      laggedReplicaId: 'replica-a',
      laggedAppliedLsn: 300,
      failoverReason: 'planned-drill',
      promoteReplicaId: 'replica-b',
    });
    expect(out.primaryLsn).toBe(500);
    expect(out.replicaLag).toBe(200); // 500 primary - 300 applied
    expect(out.failoverState).toBe('promoted');
    await adapter.reset();
  });

  it('T-DPR-003 failover promotes the chosen replica to primary', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveReplication({
      writes: [{ bytes: 200 }],
      laggedReplicaId: 'replica-a',
      laggedAppliedLsn: 100,
      failoverReason: 'primary-loss',
      promoteReplicaId: 'replica-b',
    });
    expect(out.promotedReplicaId).toBe('replica-b');
    expect(out.failoverState).toBe('promoted');
    await adapter.reset();
  });

  it('T-DPR-004 trace records replication ops in order', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveReplication({
      writes: [{ bytes: 100 }],
      laggedReplicaId: 'replica-a',
      laggedAppliedLsn: 50,
      failoverReason: 'test',
      promoteReplicaId: 'replica-b',
    });
    const trace = adapter.traces();
    expect(trace.map((t) => t.op)).toContain('driveReplication');
    expect(trace.every((t) => t.ok)).toBe(true);
    await adapter.reset();
  });
});
