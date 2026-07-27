import { expect, it } from 'vitest';
import {
  createDeadLetterQueue,
  createKafkaMock,
  createNatsMock,
  createRedpandaMock,
} from '../src/index.js';

it('documents connection, message processing, and an explicit manual commit', async () => {
  const kafka = createKafkaMock({ defaultPartitionCount: 3 });
  const producer = kafka.producer();
  await producer.connect();
  const [published] = await producer.send({
    topic: 'orders', messages: [{ key: 'user-1', value: { id: 'o-1', total: 42 } }],
  });
  const consumer = kafka.consumer({ groupId: 'billing' });
  await consumer.connect();
  await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
  const seen: unknown[] = [];
  await consumer.run({ autoCommit: false, eachMessage: async message => { seen.push(message.value); } });
  expect(seen).toEqual([{ id: 'o-1', total: 42 }]);
  expect(kafka.getCommittedOffset('billing', 'orders', published!.partition)).toBe(0);
  await consumer.commitOffsets([{ topic: 'orders', partition: published!.partition, offset: 1 }]);
  expect(kafka.getCommittedOffset('billing', 'orders', published!.partition)).toBe(1);
});

it('documents DLQ quarantine, schema rejection, and NATS subject scope', async () => {
  const dlq = createDeadLetterQueue({
    topic: 'orders', retryPolicy: { maxAttempts: 3, backoff: 'constant', baseDelayMs: 0 },
    handler: async () => { throw new Error('inventory unavailable'); },
  });
  expect(await dlq.handle({
    topic: 'orders', partition: 0, offset: 5, timestamp: 0, key: null, value: { id: 'o-1' }, headers: {},
  })).toBe('quarantined');
  expect(dlq.quarantined()[0]).toMatchObject({ attempts: 3, reason: 'inventory unavailable' });

  const redpanda = createRedpandaMock();
  await redpanda.schemaRegistry.register({
    subject: 'orders-value', kind: 'avro',
    schema: '{"type":"record","name":"Order","fields":[{"name":"id","default":""}]}',
  });
  expect(redpanda.schemaRegistry.checkCompatibility({
    subject: 'orders-value', kind: 'avro',
    schema: '{"type":"record","name":"Order","fields":[{"name":"id","default":""},{"name":"total"}]}',
  })).toMatchObject({ compatible: false });

  const nats = createNatsMock();
  const seen: string[] = [];
  nats.subscribe('orders.*.created', message => {
    seen.push(message.topic);
  });
  await nats.publish('orders.user-1.created', { id: 'o-1' });
  await nats.publish('orders.user-1.deep.created', { id: 'o-2' });
  expect(seen).toEqual(['orders.user-1.created']);
});
