import { describe, expect, it } from 'vitest';
import { createNatsJetStreamDurable } from '../../src/index.js';

// Follow-up file — reaches reset(), sweepExpired quarantine, unknown-seq
// ack/nack no-ops, and publish defaults that T-NJD-* doesn't hit.

describe('createNatsJetStreamDurable state guards', () => {
  it('T-NJD-B-001 ack with unknown seq is a no-op', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders' });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    durable.ack(9999);
    // Pending stays intact.
    expect(durable.ackPending()).toHaveLength(1);
    expect(durable.info().ackFloor).toBe(0);
  });

  it('T-NJD-B-002 nack with unknown seq is a no-op', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders' });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    durable.nack(9999, 0);
    expect(durable.ackPending()).toHaveLength(1);
  });

  it('T-NJD-B-003 sweepExpired skips entries with zero deliveries', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders', ackWaitMs: 10 });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    // No deliver() yet — sweep should return empty and not touch the pending entry.
    const expired = durable.sweepExpired(10_000);
    expect(expired).toEqual([]);
    expect(durable.ackPending()).toHaveLength(1);
  });

  it('T-NJD-B-004 sweepExpired keeps entries whose ack_wait has not elapsed', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders', ackWaitMs: 500 });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    const delivery = durable.deliver(1000);
    expect(delivery?.seq).toBe(1);
    // Only 100ms elapsed — not yet expired.
    const expired = durable.sweepExpired(1100);
    expect(expired).toEqual([]);
  });

  it('T-NJD-B-005 sweepExpired quarantines entries that have exceeded maxDeliver', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders', ackWaitMs: 100, maxDeliver: 2 });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    durable.deliver(0);
    durable.nack(1, 0);
    durable.deliver(0);
    // Sweep after ack_wait — deliveries=2 >= maxDeliver=2 → quarantine.
    const expired = durable.sweepExpired(1_000);
    expect(expired).toContain(1);
    const q = durable.quarantined();
    expect(q).toHaveLength(1);
    expect(q[0]?.reason).toMatch(/via ack_wait sweep/);
  });

  it('T-NJD-B-006 publish fills topic/partition/timestamp/headers defaults', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders', filterSubject: 'orders.new' });
    // Exercise the ?? default chain — cast to `any` to bypass the strict shape
    // check on the public signature; the impl tolerates missing fields.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seq = durable.publish({ value: 'x' } as any);
    expect(seq).toBe(1);
    const delivery = durable.deliver(2000);
    expect(delivery?.message.topic).toBe('orders.new');
    expect(delivery?.message.partition).toBe(0);
    expect(delivery?.message.headers).toEqual({});
    expect(delivery?.message.key).toBeNull();
  });

  it('T-NJD-B-007 publish without filterSubject defaults topic to durableName', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    durable.publish({ value: 'x' } as any);
    const delivery = durable.deliver(0);
    expect(delivery?.message.topic).toBe('orders');
  });

  it('T-NJD-B-008 backoff extends past its length uses the last entry', () => {
    const durable = createNatsJetStreamDurable({
      durableName: 'orders',
      maxDeliver: 5,
      backoff: [100, 200],
    });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    // attempt 1 — deliver + nack, pickBackoff(1) = 100.
    durable.deliver(0);
    durable.nack(1, 0);
    // attempt 2 — deliver + nack, pickBackoff(2) = 200.
    durable.deliver(200);
    durable.nack(1, 200);
    // attempt 3 — pickBackoff(3) clamps to backoff[1] = 200.
    durable.deliver(400);
    durable.nack(1, 400);
    // Not eligible until 400 + 200 = 600.
    expect(durable.deliver(500)).toBeNull();
    expect(durable.deliver(600)?.attempt).toBe(4);
  });

  it('T-NJD-B-009 reset clears pending, quarantine, and info counters', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders' });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    durable.deliver(0);
    durable.ack(1);
    expect(durable.info().delivered).toBe(1);
    durable.reset();
    expect(durable.info().delivered).toBe(0);
    expect(durable.info().ackFloor).toBe(0);
    expect(durable.info().pending).toBe(0);
    expect(durable.quarantined()).toEqual([]);
    // Sequences restart from 1.
    const seq = durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'y', headers: {} });
    expect(seq).toBe(1);
  });
});
