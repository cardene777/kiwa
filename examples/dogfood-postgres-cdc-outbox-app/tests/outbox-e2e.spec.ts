import { describe, expect, it } from 'vitest';
import { createOutboxRun } from '../src/outbox/index.js';
import { pickupSince } from '../src/cdc/index.js';

describe('outbox pattern — Debezium-style + LSN ordering + idempotent producer', () => {
  it('T-DPO-001 writeBatch appends N events with strictly increasing LSN', () => {
    const run = createOutboxRun({ slotName: 'slot-a' });
    run.writeBatch([
      { kind: 'insert', order: { orderId: 'o1', region: 'us', total: 100 } },
      { kind: 'insert', order: { orderId: 'o2', region: 'eu', total: 200 } },
      { kind: 'insert', order: { orderId: 'o3', region: 'apac', total: 300 } },
    ]);
    run.seal();
    const outbox = run.outbox();
    expect(outbox).toHaveLength(3);
    expect(outbox.map((e) => e.lsn)).toEqual([1, 2, 3]);
    expect(outbox.map((e) => e.kind)).toEqual(['insert', 'insert', 'insert']);
    expect(outbox.map((e) => (e.payload.orderId as string))).toEqual(['o1', 'o2', 'o3']);
  });

  it('T-DPO-002 seal on empty outbox throws (silent seal would corrupt invariant)', () => {
    const run = createOutboxRun({ slotName: 'slot-empty' });
    expect(() => run.seal()).toThrowError(/seal: outbox is empty/);
  });

  it('T-DPO-003 acknowledgeUpTo advances confirmedLsn without regression', () => {
    const run = createOutboxRun({ slotName: 'slot-ack' });
    run.writeBatch([
      { kind: 'insert', order: { orderId: 'a', region: 'us', total: 10 } },
      { kind: 'update', order: { orderId: 'a', region: 'us', total: 20 } },
    ]);
    run.seal();
    run.acknowledgeUpTo(2);
    expect(run.confirmedLsn()).toBe(2);
    // Regressing past a confirmed LSN must throw so replay bugs surface.
    expect(() => run.acknowledgeUpTo(1)).toThrowError(/regresses confirmedLsn/);
  });

  it('T-DPO-004 acknowledgeUpTo exceeding highWaterLsn throws (never-appended ack)', () => {
    const run = createOutboxRun({ slotName: 'slot-hw' });
    run.writeBatch([{ kind: 'insert', order: { orderId: 'x', region: 'us', total: 1 } }]);
    run.seal();
    expect(() => run.acknowledgeUpTo(99)).toThrowError(/exceeds outbox high-water/);
  });

  it('T-DPO-005 pickupSince returns only events past the last-committed LSN', () => {
    const run = createOutboxRun({ slotName: 'slot-pickup' });
    run.writeBatch([
      { kind: 'insert', order: { orderId: 'p1', region: 'us', total: 1 } },
      { kind: 'insert', order: { orderId: 'p2', region: 'eu', total: 2 } },
      { kind: 'insert', order: { orderId: 'p3', region: 'apac', total: 3 } },
    ]);
    run.seal();
    const pickup = pickupSince(run.outbox(), 1);
    expect(pickup.events.map((e) => e.lsn)).toEqual([2, 3]);
    expect(pickup.highWaterLsn).toBe(3);
  });

  it('T-DPO-006 startLsn offsets the counter so shard ranges are reservable', () => {
    const run = createOutboxRun({ slotName: 'slot-shard', startLsn: 1000 });
    run.writeBatch([
      { kind: 'insert', order: { orderId: 's1', region: 'us', total: 1 } },
      { kind: 'insert', order: { orderId: 's2', region: 'us', total: 2 } },
    ]);
    run.seal();
    expect(run.outbox().map((e) => e.lsn)).toEqual([1000, 1001]);
    expect(run.highWaterLsn()).toBe(1001);
  });
});
