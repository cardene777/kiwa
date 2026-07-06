import { describe, expect, it } from 'vitest';
import { driveDurableConsumer } from '../src/jetstream/durable.js';

describe('durable consumer — ack pending + backoff + max deliver quarantine', () => {
  it('T-DND-001 publishes 4 messages + delivers all 4 initially', () => {
    const result = driveDurableConsumer();
    expect(result.published).toBe(4);
    // Deliveries include the initial 4 + backoff redelivery + sweep replay.
    expect(result.deliveries).toBeGreaterThanOrEqual(result.published);
  });

  it('T-DND-002 nack + backoff triggers a redelivery of the nacked seq', () => {
    const result = driveDurableConsumer();
    expect(result.backoffRedeliveries).toBeGreaterThanOrEqual(1);
    // The backoff schedule the flow consumed should be a prefix of the config
    // default (50 / 200 / 800) for the nacked seq.
    expect(result.backoffScheduleMs.length).toBeGreaterThanOrEqual(1);
    expect(result.backoffScheduleMs[0]).toBe(50);
  });

  it('T-DND-003 ack_wait sweep expires an un-touched message', () => {
    const result = driveDurableConsumer();
    // At least the 3rd + 4th messages should have expired via the sweep.
    expect(result.ackWaitSweeps).toBeGreaterThanOrEqual(2);
  });

  it('T-DND-004 max_deliver breach lands the seq in quarantine', () => {
    const result = driveDurableConsumer();
    // The nack loop pushes seq #3 past max_deliver=2 → 1+ quarantined entries.
    expect(result.quarantined).toBeGreaterThanOrEqual(1);
    const quarantined = result.durable.quarantined();
    expect(quarantined[0]?.reason).toContain('max_deliver');
  });

  it('T-DND-005 ack floor advances past acked seqs', () => {
    const result = driveDurableConsumer();
    // The flow acks seq 1 + seq 2 (via redelivery) + seq 4.
    expect(result.ackFloor).toBeGreaterThanOrEqual(1);
    expect(result.acked).toBeGreaterThanOrEqual(2);
  });

  it('T-DND-006 durable config surfaces the requested filter subject', () => {
    const result = driveDurableConsumer();
    expect(result.durable.config.durableName).toBe('orders-durable');
    expect(result.durable.config.filterSubject).toBe('orders.>');
    expect(result.durable.config.ackWaitMs).toBe(100);
    expect(result.durable.config.maxDeliver).toBe(2);
    expect(result.durable.config.backoff).toEqual([50, 200, 800]);
  });
});
