import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { sampleOrderRow } from '../src/adapters/interface.js';
import {
  driveCdcPickupFlow,
  driveFidelityFlow,
  driveOutboxFlow,
  driveReplicationFlow,
  driveAtLeastOnceFlow,
} from '../src/flows/postgres-flows.js';

describe('end-to-end mock-mode integration', () => {
  it('T-DPE-M-001 5-op surface produces 5 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    await driveOutboxFlow(adapter, [sampleOrderRow({ orderId: 'o1' })]);
    await driveCdcPickupFlow(adapter, {
      orders: [sampleOrderRow({ orderId: 'o2', region: 'eu' })],
      ackBatchSize: 4,
    });
    await driveReplicationFlow(adapter, {
      writes: [{ bytes: 100 }],
      laggedReplicaId: 'replica-a',
      laggedAppliedLsn: 50,
      failoverReason: 'e2e',
      promoteReplicaId: 'replica-b',
    });
    await driveAtLeastOnceFlow(adapter, {
      orders: [sampleOrderRow({ orderId: 'o3', region: 'apac' })],
      duplicateOrders: [],
    });
    await driveFidelityFlow(adapter);

    const okOps = adapter.traces().filter((t) => t.ok).map((t) => t.op);
    for (const op of [
      'driveOutbox',
      'driveCdcPickup',
      'driveReplication',
      'driveAtLeastOnce',
      'emitFidelity',
    ]) {
      expect(okOps).toContain(op);
    }
    await adapter.reset();
  });

  it('T-DPE-M-002 metrics counters accumulate across ops', async () => {
    const adapter = makeMockAdapter();
    await driveOutboxFlow(adapter, [
      sampleOrderRow({ orderId: 'o1' }),
      sampleOrderRow({ orderId: 'o2', region: 'eu' }),
    ]);
    await driveReplicationFlow(adapter, {
      writes: [{ bytes: 128 }, { bytes: 256 }],
      laggedReplicaId: 'replica-a',
      laggedAppliedLsn: 100,
      failoverReason: 'metrics-test',
      promoteReplicaId: 'replica-b',
    });
    const m = adapter.metrics();
    expect(m.outboxWrites).toBe(2);
    expect(m.replicationBytes).toBe(384);
    expect(m.latencySamplesMs.length).toBe(2);
    await adapter.reset();
  });

  it('T-DPE-M-003 driveOutbox seals the outbox with LSN ordering', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveOutbox([
      sampleOrderRow({ orderId: 'a' }),
      sampleOrderRow({ orderId: 'b', region: 'eu' }),
      sampleOrderRow({ orderId: 'c', region: 'apac' }),
    ]);
    expect(out.writes).toBe(3);
    expect(out.sealed).toBe(true);
    expect(out.highWaterLsn).toBe(3);
    await adapter.reset();
  });

  it('T-DPE-M-004 driveCdcPickup delivers events + drains pending queue', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveCdcPickup({
      orders: [
        sampleOrderRow({ orderId: 'p1' }),
        sampleOrderRow({ orderId: 'p2', region: 'eu' }),
      ],
      ackBatchSize: 2,
    });
    expect(out.decodedCount).toBe(2);
    expect(out.delivered).toBe(2);
    expect(out.pending).toBe(0);
    await adapter.reset();
  });

  it('T-DPE-M-005 reset zeroes every counter + rebinds internal sessions', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveOutbox([sampleOrderRow({ orderId: 'r1' })]);
    await adapter.reset();
    // After reset, the trace + metrics are fresh — a second driveOutbox
    // must succeed without stale LSN state.
    const out = await adapter.driveOutbox([sampleOrderRow({ orderId: 'r2' })]);
    expect(out.writes).toBe(1);
    expect(out.highWaterLsn).toBe(1); // Fresh outbox counter starts at 1.
    await adapter.reset();
  });
});
