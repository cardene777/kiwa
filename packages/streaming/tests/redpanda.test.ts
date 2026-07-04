import { describe, expect, it } from 'vitest';
import {
  createRedpandaMock,
  isKafkaMock,
  isRedpandaMock,
  isSchemaRegistry,
} from '../src/index.js';

describe('createRedpandaMock (Kafka API compat)', () => {
  it('T-RP-001 Redpanda mock is also a Kafka mock', () => {
    const rp = createRedpandaMock();
    expect(isRedpandaMock(rp)).toBe(true);
    expect(isKafkaMock(rp)).toBe(true);
  });

  it('T-RP-002 producer + consumer roundtrip works via Kafka surface', async () => {
    const rp = createRedpandaMock();
    const producer = rp.producer();
    await producer.connect();
    await producer.send({ topic: 'events', messages: [{ value: 'ping' }] });
    const consumer = rp.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['events'], fromBeginning: true });
    const seen: unknown[] = [];
    await consumer.run({ eachMessage: async (m) => { seen.push(m.value); } });
    expect(seen).toEqual(['ping']);
  });

  it('T-RP-003 Redpanda exposes a colocated schema registry', () => {
    const rp = createRedpandaMock();
    expect(isSchemaRegistry(rp.schemaRegistry)).toBe(true);
  });

  it('T-RP-004 registry accepts default Avro schema registration', async () => {
    const rp = createRedpandaMock();
    const entry = await rp.schemaRegistry.register({
      subject: 'events-value',
      kind: 'avro',
      schema: '{"type":"record","name":"E","fields":[]}',
    });
    expect(entry.id).toBe(1);
    expect(entry.version).toBe(1);
  });

  it('T-RP-005 reset() clears both broker state and registry', async () => {
    const rp = createRedpandaMock();
    const producer = rp.producer();
    await producer.connect();
    await producer.send({ topic: 'events', messages: [{ value: 'x' }] });
    await rp.schemaRegistry.register({
      subject: 'events-value',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    rp.reset();
    expect(rp.getTopicMessages('events')).toEqual([]);
    expect(await rp.schemaRegistry.listSubjects()).toEqual([]);
  });

  it('T-RP-006 registry defaults to configured compat mode', () => {
    const rp = createRedpandaMock({
      schemaRegistry: { defaultCompatibility: 'FULL' },
    });
    expect(rp.schemaRegistry.getCompatibility('any')).toBe('FULL');
  });
});
