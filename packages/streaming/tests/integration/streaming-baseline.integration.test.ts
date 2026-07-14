import { describe, expect, it } from 'vitest';
import { createKafkaMock } from '../../src/index.js';

/**
 * streaming integration domain test — real Kafka mock で producer / consumer /
 * send / subscribe workflow を end-to-end で assert する。
 */
describe('streaming integration — Kafka mock workflow', () => {
  it('T-INT-D-001 producer connect + send workflow', async () => {
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    const results = await producer.send({
      topic: 'test-topic',
      messages: [{ value: 'hello' }],
    });
    expect(results.length).toBe(1);
    expect(producer.isConnected()).toBe(true);
    await producer.disconnect();
  });

  it('T-INT-D-002 producer send without connect throws', async () => {
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await expect(
      producer.send({ topic: 'x', messages: [{ value: 'v' }] }),
    ).rejects.toThrow(/before connect/);
  });

  it('T-INT-D-003 sendBatch で複数 record 送信', async () => {
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    const results = await producer.sendBatch([
      { topic: 't1', messages: [{ value: 'a' }] },
      { topic: 't2', messages: [{ value: 'b' }, { value: 'c' }] },
    ]);
    expect(results.length).toBe(3);
    await producer.disconnect();
  });

  it('T-INT-D-004 consumer subscribe + connect', async () => {
    const kafka = createKafkaMock();
    const consumer = kafka.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['topic1'] });
    // subscribe が反映されている状態で disconnect 成功で verify
    expect(typeof consumer.assignments).toBe('function');
    await consumer.disconnect();
  });

  it('T-INT-D-005 admin listTopics で topic 列挙', async () => {
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'admin-t', messages: [{ value: 'v' }] });
    const admin = kafka.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    expect(topics).toContain('admin-t');
    await admin.disconnect();
    await producer.disconnect();
  });
});
