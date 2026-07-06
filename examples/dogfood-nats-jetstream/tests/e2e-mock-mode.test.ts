import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  sampleOrderEvent,
  sampleUserProfile,
} from '../src/adapters/mock.js';
import {
  driveFidelityFlow,
  driveJetStreamDurableFlow,
  driveJetStreamFlow,
  driveKvRevisionFlow,
  driveKVFlow,
  driveObjectChunkingFlow,
  driveObjectFlow,
  driveRoutingFlow,
  driveTestcontainersProbeFlow,
} from '../src/flows/nats-flows.js';

describe('end-to-end mock-mode integration', () => {
  it('T-DNE-M-001 9-op surface produces 9 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    await driveJetStreamFlow(adapter, [
      sampleOrderEvent({ orderId: 'o-1' }),
      sampleOrderEvent({ orderId: 'o-2', currency: 'JPY' }),
      sampleOrderEvent({ orderId: 'o-3', currency: 'EUR' }),
    ]);
    await driveKVFlow(adapter, [
      sampleUserProfile({ userId: 'u-1' }),
      sampleUserProfile({ userId: 'u-2', region: 'eu' }),
    ]);
    await driveObjectFlow(adapter);
    await driveRoutingFlow(adapter);
    await driveFidelityFlow(adapter);
    await driveJetStreamDurableFlow(adapter);
    await driveKvRevisionFlow(adapter);
    await driveObjectChunkingFlow(adapter);
    await driveTestcontainersProbeFlow(adapter);
    const okOps = adapter
      .traces()
      .filter((t) => t.ok)
      .map((t) => t.op);
    for (const op of [
      'driveJetStream',
      'driveKV',
      'driveObject',
      'driveRouting',
      'emitFidelity',
      'driveJetStreamDurable',
      'driveKvRevision',
      'driveObjectChunking',
      'driveTestcontainersProbe',
    ]) {
      expect(okOps).toContain(op);
    }
    await adapter.reset();
  });

  it('T-DNE-M-002 driveJetStream publishes N events and reports the same count', async () => {
    const adapter = makeMockAdapter();
    const out = await driveJetStreamFlow(adapter, [
      sampleOrderEvent({ orderId: 'o-1' }),
      sampleOrderEvent({ orderId: 'o-2', currency: 'JPY' }),
    ]);
    expect(out.published).toBe(2);
    // 1 message left un-acked so we can observe the redelivery bump.
    expect(out.acked).toBe(1);
    expect(out.redelivered).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DNE-M-003 driveKV puts N profiles and bumps the revision by N+1', async () => {
    const adapter = makeMockAdapter();
    const out = await driveKVFlow(adapter, [
      sampleUserProfile({ userId: 'u-1' }),
      sampleUserProfile({ userId: 'u-2', region: 'eu' }),
      sampleUserProfile({ userId: 'u-3', region: 'jp' }),
    ]);
    expect(out.puts).toBe(3);
    expect(out.updates).toBe(1);
    expect(out.deletes).toBe(1);
    expect(out.lastRevision).toBe(4);
    await adapter.reset();
  });

  it('T-DNE-M-004 driveObject stores 3 objects with unique digests', async () => {
    const adapter = makeMockAdapter();
    const out = await driveObjectFlow(adapter);
    expect(out.objectsPut).toBe(3);
    expect(out.uniqueDigests).toBe(3);
    expect(out.totalBytesStored).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DNE-M-005 driveRouting reports 4 delivery counts + 3-member queue group', async () => {
    const adapter = makeMockAdapter();
    const out = await driveRoutingFlow(adapter);
    expect(out.literal).toBe(1);
    expect(out.wildcard).toBe(2);
    expect(out.catchAll).toBe(3);
    expect(out.queue).toBe(6);
    expect(out.queueSize).toBe(3);
    await adapter.reset();
  });

  it('T-DNE-M-006 metrics counters accumulate across v1 + v2 ops', async () => {
    const adapter = makeMockAdapter();
    await driveJetStreamFlow(adapter, [sampleOrderEvent({ orderId: 'o-1' })]);
    await driveKVFlow(adapter, [sampleUserProfile({ userId: 'u-1' })]);
    await driveObjectFlow(adapter);
    await driveRoutingFlow(adapter);
    await driveJetStreamDurableFlow(adapter);
    await driveKvRevisionFlow(adapter);
    await driveObjectChunkingFlow(adapter);
    await driveTestcontainersProbeFlow(adapter);
    const m = adapter.metrics();
    expect(m.jetstreamPublished).toBe(1);
    expect(m.jetstreamAcked).toBe(0);
    expect(m.kvOperations).toBeGreaterThan(0);
    expect(m.objectBytesStored).toBeGreaterThan(0);
    expect(m.routingDeliveries).toBeGreaterThan(0);
    expect(m.durableDeliveries).toBeGreaterThan(0);
    expect(m.durableQuarantined).toBeGreaterThanOrEqual(1);
    expect(m.kvRevisionsWritten).toBe(5);
    expect(m.objectChunksWritten).toBeGreaterThanOrEqual(4);
    expect(m.testcontainersProbes).toBe(1);
    expect(m.latencySamplesMs.length).toBe(8);
    await adapter.reset();
  });

  it('T-DNE-M-007 reset() clears trace + metrics + nats state', async () => {
    const adapter = makeMockAdapter();
    await driveJetStreamFlow(adapter, [sampleOrderEvent({ orderId: 'o-1' })]);
    await driveJetStreamDurableFlow(adapter);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().jetstreamPublished).toBe(0);
    expect(adapter.metrics().durableDeliveries).toBe(0);
    expect(adapter.metrics().kvRevisionsWritten).toBe(0);
    expect(adapter.metrics().latencySamplesMs).toHaveLength(0);
  });

  it('T-DNE-M-008 v2 ops surface stable observations', async () => {
    const adapter = makeMockAdapter();
    const durable = await driveJetStreamDurableFlow(adapter);
    const revision = await driveKvRevisionFlow(adapter);
    const chunking = await driveObjectChunkingFlow(adapter);
    const probe = await driveTestcontainersProbeFlow(adapter);
    expect(durable.published).toBe(4);
    expect(durable.quarantined).toBeGreaterThanOrEqual(1);
    expect(revision.revisions).toHaveLength(5);
    expect(revision.deleteTombstoneObserved).toBe(true);
    expect(chunking.chunkCount).toBeGreaterThanOrEqual(4);
    expect(chunking.compression).toBe('lz4');
    expect(chunking.reassembledMatches).toBe(true);
    expect(probe.reachable).toBe(true);
    await adapter.reset();
  });
});
