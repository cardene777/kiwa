import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  sampleOrderEvent,
  sampleUserProfile,
} from '../src/adapters/mock.js';
import {
  driveFidelityFlow,
  driveJetStreamFlow,
  driveKVFlow,
  driveObjectFlow,
  driveRoutingFlow,
} from '../src/flows/nats-flows.js';

describe('end-to-end mock-mode integration', () => {
  it('T-DNE-M-001 5-op surface produces 5 ok trace entries', async () => {
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
    // 1 explicit update on the first profile.
    expect(out.updates).toBe(1);
    // 1 explicit delete on the last profile.
    expect(out.deletes).toBe(1);
    // Revisions: 3 puts + 1 update = 4.
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

  it('T-DNE-M-006 metrics counters accumulate across ops', async () => {
    const adapter = makeMockAdapter();
    await driveJetStreamFlow(adapter, [sampleOrderEvent({ orderId: 'o-1' })]);
    await driveKVFlow(adapter, [sampleUserProfile({ userId: 'u-1' })]);
    await driveObjectFlow(adapter);
    await driveRoutingFlow(adapter);
    const m = adapter.metrics();
    expect(m.jetstreamPublished).toBe(1);
    expect(m.jetstreamAcked).toBe(0); // 1 published, 1 left un-acked.
    expect(m.kvOperations).toBeGreaterThan(0);
    expect(m.objectBytesStored).toBeGreaterThan(0);
    expect(m.routingDeliveries).toBeGreaterThan(0);
    expect(m.latencySamplesMs.length).toBe(4);
    await adapter.reset();
  });

  it('T-DNE-M-007 reset() clears trace + metrics + nats state', async () => {
    const adapter = makeMockAdapter();
    await driveJetStreamFlow(adapter, [sampleOrderEvent({ orderId: 'o-1' })]);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().jetstreamPublished).toBe(0);
    expect(adapter.metrics().latencySamplesMs).toHaveLength(0);
  });
});
