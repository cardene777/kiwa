import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { createKafkaMock } from '../../src/index.js';

/**
 * streaming skill domain test — Kafka mock 主要 skill flow を spy 経路で assert する。
 */
describe('streaming skill — Kafka skill flow', () => {
  it('T-SKL-D-001 producer connect + send skill flow', async () => {
    const spy = createToolSpy();
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    spy.record('kafka.producer.connect', '{}');
    await producer.send({ topic: 'sk', messages: [{ value: 'v' }] });
    spy.record('kafka.producer.send', JSON.stringify({ topic: 'sk' }));

    assertToolCallOrder(spy, ['kafka.producer.connect', 'kafka.producer.send']);
    await producer.disconnect();
  });

  it('T-SKL-D-002 producer disconnect skill flow', async () => {
    const spy = createToolSpy();
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    spy.record('kafka.producer.connect', '{}');
    await producer.disconnect();
    spy.record('kafka.producer.disconnect', '{}');

    assertToolCallOrder(spy, ['kafka.producer.connect', 'kafka.producer.disconnect']);
    expect(producer.isConnected()).toBe(false);
  });

  it('T-SKL-D-003 batch send skill (times=3)', async () => {
    const spy = createToolSpy();
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 't', messages: [{ value: '1' }] });
    spy.record('kafka.producer.send', '{}');
    await producer.send({ topic: 't', messages: [{ value: '2' }] });
    spy.record('kafka.producer.send', '{}');
    await producer.send({ topic: 't', messages: [{ value: '3' }] });
    spy.record('kafka.producer.send', '{}');

    assertToolCalled(spy, 'kafka.producer.send', { times: 3 });
    await producer.disconnect();
  });

  it('T-SKL-D-004 consumer subscribe skill flow', async () => {
    const spy = createToolSpy();
    const kafka = createKafkaMock();
    const consumer = kafka.consumer({ groupId: 'sk4' });
    await consumer.connect();
    spy.record('kafka.consumer.connect', '{}');
    await consumer.subscribe({ topics: ['sk-t'] });
    spy.record('kafka.consumer.subscribe', JSON.stringify({ topics: ['sk-t'] }));

    assertToolCallOrder(spy, ['kafka.consumer.connect', 'kafka.consumer.subscribe']);
    await consumer.disconnect();
  });

  it('T-SKL-D-005 admin listTopics skill flow', async () => {
    const spy = createToolSpy();
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'adm', messages: [{ value: 'v' }] });
    spy.record('kafka.producer.send', '{}');
    const admin = kafka.admin();
    await admin.connect();
    spy.record('kafka.admin.connect', '{}');
    const topics = await admin.listTopics();
    spy.record('kafka.admin.listTopics', '{}');

    assertToolCallOrder(spy, ['kafka.producer.send', 'kafka.admin.connect', 'kafka.admin.listTopics']);
    expect(topics.length).toBeGreaterThan(0);
    await admin.disconnect();
    await producer.disconnect();
  });
});
