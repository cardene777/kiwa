import { describe, expect, it } from 'vitest';
import {
  createNatsJetStreamDurable,
  isNatsJetStreamDurable,
} from '../../src/index.js';

describe('createNatsJetStreamDurable', () => {
  it('T-NJD-001 publish assigns monotonic seq and appears in ackPending', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders' });
    expect(isNatsJetStreamDurable(durable)).toBe(true);
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'a', headers: {} });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'b', headers: {} });
    expect(durable.ackPending().map((p) => p.seq)).toEqual([1, 2]);
  });

  it('T-NJD-002 deliver dispatches the earliest pending message and increments attempt', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders' });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'first', headers: {} });
    const attempt = durable.deliver(1000);
    expect(attempt?.seq).toBe(1);
    expect(attempt?.attempt).toBe(1);
    expect(durable.info().delivered).toBe(1);
  });

  it('T-NJD-003 ack removes the message from ackPending', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders' });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    const delivery = durable.deliver(1000);
    expect(delivery).not.toBeNull();
    durable.ack(delivery?.seq ?? 0);
    expect(durable.ackPending()).toHaveLength(0);
    expect(durable.info().ackFloor).toBe(delivery?.seq);
  });

  it('T-NJD-004 nack respects backoff and defers redelivery', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders', maxDeliver: 5, backoff: [500, 1500] });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    const first = durable.deliver(1000);
    durable.nack(first?.seq ?? 0, 1000);
    // 500ms later — not yet eligible for redelivery? Actually pickBackoff(1) = 500.
    expect(durable.deliver(1400)).toBeNull();
    expect(durable.deliver(1600)?.attempt).toBe(2);
  });

  it('T-NJD-005 max_deliver exhaustion moves message to quarantine', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders', maxDeliver: 2 });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    const first = durable.deliver(0);
    durable.nack(first?.seq ?? 0, 0);
    const second = durable.deliver(0);
    expect(second?.attempt).toBe(2);
    durable.nack(second?.seq ?? 0, 0);
    // On the 3rd nack attempt (deliveries >= maxDeliver), quarantine.
    const third = durable.deliver(0);
    expect(third).toBeNull();
    expect(durable.quarantined()).toHaveLength(1);
    expect(durable.quarantined()[0]?.reason).toMatch(/exceeded max_deliver/);
  });

  it('T-NJD-006 sweepExpired requeues messages whose ack_wait elapsed', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders', ackWaitMs: 100 });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });
    durable.deliver(0);
    const expired = durable.sweepExpired(500);
    expect(expired).toContain(1);
    // Deliverable again immediately.
    expect(durable.deliver(600)?.attempt).toBe(2);
  });

  it('T-NJD-007 ack_policy=all cascades acks to prior seq', () => {
    const durable = createNatsJetStreamDurable({ durableName: 'orders', ackPolicy: 'all' });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'a', headers: {} });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'b', headers: {} });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'c', headers: {} });
    durable.deliver(0);
    durable.deliver(0);
    durable.deliver(0);
    durable.ack(3);
    expect(durable.ackPending()).toHaveLength(0);
  });
});
