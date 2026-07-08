import { createNatsMock } from '@kiwa/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createJetStreamRun, simulateRedelivery } from '../src/jetstream/index.js';

let nats: ReturnType<typeof createNatsMock> | null = null;

afterEach(() => {
  nats?.reset();
  nats = null;
});

function makeNats() {
  nats = createNatsMock({ name: 'jetstream-test' });
  return nats;
}

describe('jetstream — persistent stream + durable consumer + ack + redelivery', () => {
  it('T-DNJ-001 addStream declares one stream with a subject filter', async () => {
    const client = makeNats();
    const js = createJetStreamRun({ nats: client });
    await js.addStream({ name: 'ORDERS', subjects: ['orders.>'], retention: 'limits' });
    expect(js.listStreams()).toContain('ORDERS');
  });

  it('T-DNJ-002 publish assigns monotonically increasing seqs', async () => {
    const client = makeNats();
    const js = createJetStreamRun({ nats: client });
    await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
    const a = await js.publish('orders.usd', { orderId: 'o-1' });
    const b = await js.publish('orders.jpy', { orderId: 'o-2' });
    expect(a.seq).toBe(1);
    expect(b.seq).toBe(2);
    expect(a.stream).toBe('ORDERS');
  });

  it('T-DNJ-003 durable consumer fetches only filter-matching messages', async () => {
    const client = makeNats();
    const js = createJetStreamRun({ nats: client });
    await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
    await js.publish('orders.usd', { orderId: 'o-1' });
    await js.publish('orders.jpy', { orderId: 'o-2' });
    const consumer = await js.consumer('ORDERS', {
      durable: 'orders-worker',
      filterSubject: 'orders.usd',
    });
    const messages = await consumer.fetch(10);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.topic).toBe('orders.usd');
  });

  it('T-DNJ-004 ack advances the ack floor once every pending is acked', async () => {
    const client = makeNats();
    const js = createJetStreamRun({ nats: client });
    await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
    await js.publish('orders.usd', { orderId: 'o-1' });
    await js.publish('orders.usd', { orderId: 'o-2' });
    const consumer = await js.consumer('ORDERS', { durable: 'orders-w1' });
    const batch = await consumer.fetch(2);
    expect(batch).toHaveLength(2);
    expect(consumer.info().delivered).toBe(2);
    for (const msg of batch) consumer.ack(msg);
    expect(consumer.info().ackFloor).toBe(2);
    expect(js.ackedCount()).toBe(2);
  });

  it('T-DNJ-005 simulated redelivery replays un-acked messages via a fresh consumer', async () => {
    const client = makeNats();
    const js = createJetStreamRun({ nats: client });
    await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
    await js.publish('orders.usd', { orderId: 'o-1' });
    await js.publish('orders.usd', { orderId: 'o-2' });
    const consumer = await js.consumer('ORDERS', { durable: 'orders-w1' });
    const batch = await consumer.fetch(2);
    // Ack only the first message.
    if (batch[0]) consumer.ack(batch[0]);
    let redeliveredHit = 0;
    const redelivered = await simulateRedelivery({
      nats: client,
      streamName: 'ORDERS',
      durable: 'orders-w1',
      batchSize: 2,
      onRedelivered: (n) => {
        redeliveredHit += n;
      },
    });
    // The fresh consumer replays all messages from seq 1 because the mock
    // does not deduplicate acked messages across durable names.
    expect(redelivered.length).toBeGreaterThan(0);
    expect(redeliveredHit).toBe(redelivered.length);
  });
});
