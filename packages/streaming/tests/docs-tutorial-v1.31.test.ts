/**
 * v1.31-5 docs 補強 (Issue #1013) — tutorial 58-60 code snippet validation.
 *
 * `docs/tutorials/58-kafka-raw-protocol.md` /
 * `docs/tutorials/59-redpanda-schema-evolution.md` /
 * `docs/tutorials/60-nats-jetstream-durable.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * v1.23 → v1.31 で 9 milestone 連続 snippet validation streak を延伸。
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import {
  createKafkaRawProtocol,
  createRedpandaSchemaEvolution,
  createNatsJetStreamDurable,
  createFidelityHarness,
  isRealDriverMode,
  requiredKeyFor,
  isKafkaRawProtocol,
  isRedpandaSchemaEvolution,
  isNatsJetStreamDurable,
  isFidelityHarness,
} from '../src/index.js';

// -----------------------------------------------------------------------------
// tutorial 58 — Kafka raw protocol
// -----------------------------------------------------------------------------

describe('tutorial 58 — KIP-98 producer identity fencing', () => {
  it('fenceProducer bumps epoch and invalidates the old identity (tutorial: 1st snippet)', () => {
    const raw = createKafkaRawProtocol();
    expect(isKafkaRawProtocol(raw)).toBe(true);

    const first = raw.initProducerId();
    expect(first.epoch).toBe(0);
    expect(raw.isValidEpoch(first)).toBe(true);

    const fenced = raw.fenceProducer(first.producerId);
    expect(fenced.epoch).toBe(1);
    expect(raw.isValidEpoch(first)).toBe(false);
    expect(raw.isValidEpoch(fenced)).toBe(true);
  });
});

describe('tutorial 58 — Kafka txn coordinator state machine', () => {
  it('follows Empty → Ongoing → PrepareCommit → CompleteCommit → Empty (tutorial: happy path)', () => {
    const raw = createKafkaRawProtocol();
    expect(raw.transactionState()).toBe('Empty');

    raw.transitionTransaction('Empty', 'Ongoing');
    raw.transitionTransaction('Ongoing', 'PrepareCommit');
    raw.transitionTransaction('PrepareCommit', 'CompleteCommit');
    raw.transitionTransaction('CompleteCommit', 'Empty');

    expect(raw.transactionState()).toBe('Empty');
  });

  it('rejects illegal transitions Empty → PrepareCommit (tutorial: reject snippet)', () => {
    const raw = createKafkaRawProtocol();
    expect(() => raw.transitionTransaction('Empty', 'PrepareCommit')).toThrow(/invalid txn transition/);
  });
});

describe('tutorial 58 — KIP-227 incremental fetch session', () => {
  it('bumpFetchSession increments the epoch (tutorial: bump snippet)', () => {
    const raw = createKafkaRawProtocol();
    const session = raw.openFetchSession();
    expect(session.epoch).toBe(0);

    expect(raw.bumpFetchSession(session.sessionId)).toBe(1);
    expect(raw.bumpFetchSession(session.sessionId)).toBe(2);
    expect(raw.bumpFetchSession(session.sessionId)).toBe(3);
  });

  it('throws when the session id is unknown (tutorial: throw snippet)', () => {
    const raw = createKafkaRawProtocol();
    expect(() => raw.bumpFetchSession(9999)).toThrow(/fetch session .* not open/);
  });
});

describe('tutorial 58 — ISR + high-watermark advance', () => {
  it('HW advances when ISR >= min.insync.replicas (tutorial: advance snippet)', () => {
    const raw = createKafkaRawProtocol({ replicationFactor: 3, minInSyncReplicas: 2 });
    raw.addToIsr('orders', 0, 1);
    raw.addToIsr('orders', 0, 2);
    expect(raw.getIsr('orders', 0)).toEqual([1, 2]);

    expect(raw.advanceHighWatermark('orders', 0, 100)).toBe(100);
    expect(raw.getHighWatermark('orders', 0)).toBe(100);
  });

  it('HW freezes when ISR shrinks below min.insync.replicas (tutorial: freeze snippet)', () => {
    const raw = createKafkaRawProtocol({ replicationFactor: 3, minInSyncReplicas: 2 });
    raw.addToIsr('orders', 0, 1);
    raw.addToIsr('orders', 0, 2);
    raw.advanceHighWatermark('orders', 0, 50);
    raw.removeFromIsr('orders', 0, 2);
    expect(raw.getIsr('orders', 0)).toEqual([1]);

    expect(raw.advanceHighWatermark('orders', 0, 100)).toBe(50);
    expect(raw.getHighWatermark('orders', 0)).toBe(50);
  });
});

// -----------------------------------------------------------------------------
// tutorial 59 — Redpanda schema evolution
// -----------------------------------------------------------------------------

describe('tutorial 59 — BACKWARD compatibility', () => {
  it('adding an optional field is BACKWARD-compatible (tutorial: OPTIONAL_ADD snippet)', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'BACKWARD' });
    expect(isRedpandaSchemaEvolution(registry)).toBe(true);

    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });

    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} OPTIONAL_ADD:tracking_number',
    });
    expect(check.compatible).toBe(true);
    expect(check.mode).toBe('BACKWARD');
  });

  it('adding a required field breaks BACKWARD (tutorial: REQUIRED_ADD snippet)', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'BACKWARD' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });

    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} REQUIRED_ADD:merchant_id',
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons[0]).toMatch(/added required field/);
  });
});

describe('tutorial 59 — FORWARD compatibility', () => {
  it('adding a required field is FORWARD-compatible (tutorial: FORWARD snippet)', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });
    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} REQUIRED_ADD:merchant_id',
    });
    expect(check.compatible).toBe(true);
  });

  it('removing a required field breaks FORWARD (tutorial: REQUIRED_REMOVE snippet)', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });
    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} REQUIRED_REMOVE:merchant_id',
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons[0]).toMatch(/removed required field/);
  });
});

describe('tutorial 59 — FULL compatibility', () => {
  it('type change on a field breaks FULL (tutorial: TYPE_CHANGE snippet)', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'FULL' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });

    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} TYPE_CHANGE:price',
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons.join(' ')).toMatch(/type change on field/);
  });
});

describe('tutorial 59 — subject naming strategies', () => {
  it('topic-name — {topic}-{key|value} (tutorial: topic-name snippet)', () => {
    const registry = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-name' });
    expect(registry.subjectFor('orders', 'value')).toBe('orders-value');
    expect(registry.subjectFor('orders', 'key')).toBe('orders-key');
  });

  it('record-name — {recordName} (tutorial: record-name snippet)', () => {
    const registry = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'record-name' });
    expect(registry.subjectFor('orders', 'value', 'com.acme.Order')).toBe('com.acme.Order');
  });

  it('topic-record-name — {topic}-{recordName} (tutorial: topic-record-name snippet)', () => {
    const registry = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-record-name' });
    expect(registry.subjectFor('orders', 'value', 'com.acme.Order')).toBe('orders-com.acme.Order');
  });
});

describe('tutorial 59 — schema references', () => {
  it('registers Address, then Order references Address v1 (tutorial: reference resolution)', () => {
    const registry = createRedpandaSchemaEvolution();
    const address = registry.register({
      subject: 'address-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Address","fields":[]}',
    });
    expect(address.version).toBe(1);

    const order = registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[{"name":"ship_to","type":"Address"}]}',
      references: [{ name: 'Address', subject: 'address-value', version: 1 }],
    });
    expect(order.references).toEqual([{ name: 'Address', subject: 'address-value', version: 1 }]);

    const resolved = registry.resolveReferences(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.subject).toBe('address-value');
  });

  it('throws when a reference version is not registered (tutorial: unknown ref snippet)', () => {
    const registry = createRedpandaSchemaEvolution();
    expect(() =>
      registry.register({
        subject: 'orders-value',
        kind: 'avro',
        schema: '{"type":"record","name":"Order"}',
        references: [{ name: 'Address', subject: 'address-value', version: 1 }],
      }),
    ).toThrow(/unknown reference subject/);
  });
});

// -----------------------------------------------------------------------------
// tutorial 60 — NATS JetStream durable
// -----------------------------------------------------------------------------

describe('tutorial 60 — durable consumer happy path', () => {
  it('delivers each unacked message once and acks it done (tutorial: happy path)', () => {
    const durable = createNatsJetStreamDurable<string>({
      durableName: 'orders-worker',
      ackWaitMs: 1_000,
      maxDeliver: 3,
    });
    expect(isNatsJetStreamDurable(durable)).toBe(true);

    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'first', headers: {} });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'second', headers: {} });

    const attempt1 = durable.deliver(100);
    expect(attempt1?.message.value).toBe('first');
    expect(attempt1?.attempt).toBe(1);
    durable.ack(attempt1!.seq);

    const attempt2 = durable.deliver(200);
    expect(attempt2?.message.value).toBe('second');
    durable.ack(attempt2!.seq);

    expect(durable.deliver(300)).toBeNull();
    expect(durable.info().pending).toBe(0);
  });
});

describe('tutorial 60 — backoff schedule', () => {
  it('respects the per-attempt backoff between redeliveries (tutorial: backoff snippet)', () => {
    const durable = createNatsJetStreamDurable<string>({
      durableName: 'retry-worker',
      ackWaitMs: 5_000,
      maxDeliver: 5,
      backoff: [100, 500, 2_000],
    });
    durable.publish({ topic: 'jobs', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });

    const first = durable.deliver(0);
    expect(first?.attempt).toBe(1);
    durable.nack(first!.seq, 0);

    expect(durable.deliver(50)).toBeNull();

    const second = durable.deliver(200);
    expect(second?.attempt).toBe(2);
    durable.nack(second!.seq, 200);

    expect(durable.deliver(500)).toBeNull();

    const third = durable.deliver(800);
    expect(third?.attempt).toBe(3);
  });
});

describe('tutorial 60 — max_deliver + quarantine', () => {
  it('quarantines the message on the maxDeliver+1st failure (tutorial: quarantine snippet)', () => {
    const durable = createNatsJetStreamDurable<string>({
      durableName: 'q-worker',
      ackWaitMs: 100,
      maxDeliver: 3,
    });
    durable.publish({ topic: 'q', partition: 0, timestamp: 0, key: null, value: 'poison', headers: {} });

    let now = 0;
    for (let i = 0; i < 3; i++) {
      const attempt = durable.deliver(now);
      expect(attempt).not.toBeNull();
      durable.nack(attempt!.seq, now);
      now += 200;
    }

    expect(durable.deliver(now)).toBeNull();
    const q = durable.quarantined();
    expect(q).toHaveLength(1);
    expect(q[0]?.attempts).toBe(3);
    expect(q[0]?.reason).toMatch(/max_deliver/);
  });
});

describe('tutorial 60 — sweepExpired ack_wait timer', () => {
  it('sweeps stuck deliveries and enables redelivery (tutorial: sweep snippet)', () => {
    const durable = createNatsJetStreamDurable<string>({
      durableName: 'stuck-worker',
      ackWaitMs: 1_000,
      maxDeliver: 5,
    });
    durable.publish({ topic: 'jobs', partition: 0, timestamp: 0, key: null, value: 'v', headers: {} });

    const first = durable.deliver(0);
    expect(first?.attempt).toBe(1);
    expect(durable.deliver(500)).toBeNull();

    const swept = durable.sweepExpired(1_500);
    expect(swept).toContain(first!.seq);

    const second = durable.deliver(1_500);
    expect(second?.attempt).toBe(2);
    expect(second?.seq).toBe(first!.seq);
  });
});

// -----------------------------------------------------------------------------
// migration guide + concept doc snippets
// -----------------------------------------------------------------------------

describe('migration v1.30→v1.31 — createFidelityHarness snippet', () => {
  it('totalCells returns 24 (3 provider × 8 axis) (migration: harness snippet)', () => {
    const harness = createFidelityHarness();
    expect(isFidelityHarness(harness)).toBe(true);
    expect(harness.totalCells()).toBe(24);

    const kafkaCells = harness.cellsFor('kafka');
    expect(kafkaCells).toHaveLength(8);

    const missing = harness.axesFor('nats', 'not-applicable');
    expect(missing).toContain('kafka-raw-protocol');
    expect(missing).toContain('kafka-consumer-group');
    expect(missing).toContain('redpanda-schema-evolution');
    expect(missing).toContain('redpanda-transactions');
  });
});

describe('migration v1.30→v1.31 — KIWA_MODE=real env-gate contract', () => {
  it('isRealDriverMode reflects env.KIWA_MODE (migration: env-gate snippet)', () => {
    expect(isRealDriverMode({ KIWA_MODE: 'real' } as NodeJS.ProcessEnv)).toBe(true);
    expect(isRealDriverMode({ KIWA_MODE: 'mock' } as NodeJS.ProcessEnv)).toBe(false);
    expect(isRealDriverMode({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it('requiredKeyFor maps axes to their env key (migration: env-gate key snippet)', () => {
    expect(requiredKeyFor('kafka-raw-protocol')).toBe('KAFKA_KEY');
    expect(requiredKeyFor('kafka-consumer-group')).toBe('KAFKA_KEY');
    expect(requiredKeyFor('redpanda-schema-evolution')).toBe('REDPANDA_KEY');
    expect(requiredKeyFor('redpanda-transactions')).toBe('REDPANDA_KEY');
    expect(requiredKeyFor('nats-jetstream-durable')).toBe('NATS_KEY');
    expect(requiredKeyFor('nats-kv-object')).toBe('NATS_KEY');
    expect(requiredKeyFor('exactly-once')).toBeNull();
    expect(requiredKeyFor('consumer-lag-telemetry')).toBeNull();
  });
});
