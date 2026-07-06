/**
 * Kafka raw-protocol (v1.31-2) behavior — KIP-98 producer id + epoch fencing,
 * transaction coordinator state machine, incremental fetch sessions, ISR +
 * high-watermark. The adapter delegates to `@kiwa-test/streaming`'s
 * `createKafkaRawProtocol` axis, these tests assert the shape of the
 * observation returned to the caller.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('raw protocol — KIP-98 producer id + epoch + txn coordinator', () => {
  it('T-DKR-001 driveRawProtocol returns a fresh (producerId, epoch=0) pair then bumps to epoch 1', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveRawProtocol();
    expect(out.initialEpoch).toBe(0);
    expect(out.fencedEpoch).toBe(1);
    // The observed txn state trajectory must be Empty → Ongoing →
    // PrepareCommit → CompleteCommit → Empty.
    expect(out.txnStates).toEqual([
      'Empty',
      'Ongoing',
      'PrepareCommit',
      'CompleteCommit',
      'Empty',
    ]);
    await adapter.reset();
  });

  it('T-DKR-002 fetch session opens with epoch 0 then bumps to epoch 1', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveRawProtocol();
    expect(out.fetchSessionId).toBeGreaterThan(0);
    expect(out.fetchSessionEpoch).toBe(1);
    await adapter.reset();
  });

  it('T-DKR-003 metrics.rawProtocolFences increments once per drive', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveRawProtocol();
    await adapter.driveRawProtocol();
    expect(adapter.metrics().rawProtocolFences).toBe(2);
    await adapter.reset();
  });

  it('T-DKR-004 driveRawProtocol appends a single ok trace entry', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveRawProtocol();
    const entries = adapter.traces().filter((t) => t.op === 'driveRawProtocol');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.ok).toBe(true);
    await adapter.reset();
  });

  it('T-DKR-005 producer ids are monotonically increasing across drives', async () => {
    const adapter = makeMockAdapter();
    const first = await adapter.driveRawProtocol();
    const second = await adapter.driveRawProtocol();
    expect(second.producerId).toBeGreaterThan(first.producerId);
    await adapter.reset();
  });
});

describe('raw protocol — ISR + high-watermark advance', () => {
  it('T-DKI-001 driveIsrHighWatermark reports ISR size 3 when 3 brokers join', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveIsrHighWatermark('orders', 0, 100);
    expect(out.isrSize).toBe(3);
    await adapter.reset();
  });

  it('T-DKI-002 high-watermark advances to the target offset when ISR gate passes', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveIsrHighWatermark('orders', 0, 42);
    expect(out.highWatermark).toBe(42);
    expect(out.advanced).toBe(true);
    await adapter.reset();
  });

  it('T-DKI-003 metrics.isrAdvances increments only on a real advance', async () => {
    const adapter = makeMockAdapter();
    // First call — HW: 0 → 10, advanced true.
    await adapter.driveIsrHighWatermark('orders', 0, 10);
    // Second call same target — HW stays at 10, advanced false.
    const second = await adapter.driveIsrHighWatermark('orders', 0, 10);
    expect(second.advanced).toBe(false);
    expect(adapter.metrics().isrAdvances).toBe(1);
    await adapter.reset();
  });

  it('T-DKI-004 different partitions carry independent watermarks', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveIsrHighWatermark('orders', 0, 5);
    const p1 = await adapter.driveIsrHighWatermark('orders', 1, 8);
    expect(p1.highWatermark).toBe(8);
    await adapter.reset();
  });
});
