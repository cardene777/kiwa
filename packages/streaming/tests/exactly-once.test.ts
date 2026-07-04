import { describe, expect, it } from 'vitest';
import {
  createIdempotentProducer,
  createKafkaMock,
  createReadCommittedFilter,
  createTransactionalProducer,
  isIdempotentProducer,
  isTransactionalProducer,
} from '../src/index.js';

describe('createIdempotentProducer', () => {
  it('T-EOS-001 sends messages with a unique sequence number', async () => {
    const kafka = createKafkaMock();
    const producer = createIdempotentProducer({ kafka });
    expect(isIdempotentProducer(producer)).toBe(true);
    await producer.connect();
    const res = await producer.send({ topic: 't', messages: [{ value: 'x' }] }, 1);
    expect(res).toHaveLength(1);
  });

  it('T-EOS-002 dedups duplicate sequence numbers', async () => {
    const kafka = createKafkaMock();
    const producer = createIdempotentProducer({ kafka });
    await producer.connect();
    await producer.send({ topic: 't', messages: [{ value: 'a' }] }, 42);
    const dup = await producer.send({ topic: 't', messages: [{ value: 'a-dup' }] }, 42);
    expect(dup).toEqual([]);
    expect(kafka.getTopicMessages('t')).toHaveLength(1);
    expect(producer.isDuplicate(42)).toBe(true);
    expect(producer.isDuplicate(99)).toBe(false);
  });

  it('T-EOS-003 different sequences append to the same topic', async () => {
    const kafka = createKafkaMock();
    const producer = createIdempotentProducer({ kafka });
    await producer.connect();
    await producer.send({ topic: 't', messages: [{ value: 'a' }] }, 1);
    await producer.send({ topic: 't', messages: [{ value: 'b' }] }, 2);
    expect(kafka.getTopicMessages('t').map((m) => m.value)).toEqual(['a', 'b']);
  });
});

describe('createTransactionalProducer', () => {
  it('T-EOS-004 requires initTransactions before begin', async () => {
    const kafka = createKafkaMock();
    const p = createTransactionalProducer({ kafka, transactionalId: 'tx-1' });
    expect(isTransactionalProducer(p)).toBe(true);
    await p.connect();
    await expect(p.beginTransaction()).rejects.toThrow(/initTransactions/);
  });

  it('T-EOS-005 commit flushes pending records to the broker', async () => {
    const kafka = createKafkaMock();
    const p = createTransactionalProducer({ kafka, transactionalId: 'tx-1' });
    await p.connect();
    await p.initTransactions();
    await p.beginTransaction();
    await p.send({ topic: 't', messages: [{ value: 'a' }] });
    await p.send({ topic: 't', messages: [{ value: 'b' }] });
    // Pre-commit: nothing visible.
    expect(kafka.getTopicMessages('t')).toHaveLength(0);
    await p.commitTransaction();
    expect(kafka.getTopicMessages('t').map((m) => m.value)).toEqual(['a', 'b']);
    expect(p.currentState()).toBe('committed');
  });

  it('T-EOS-006 abort discards pending records', async () => {
    const kafka = createKafkaMock();
    const p = createTransactionalProducer({ kafka, transactionalId: 'tx-2' });
    await p.connect();
    await p.initTransactions();
    await p.beginTransaction();
    await p.send({ topic: 't', messages: [{ value: 'ghost' }] });
    await p.abortTransaction();
    expect(kafka.getTopicMessages('t')).toHaveLength(0);
    expect(p.currentState()).toBe('aborted');
  });

  it('T-EOS-007 send outside a transaction throws', async () => {
    const kafka = createKafkaMock();
    const p = createTransactionalProducer({ kafka, transactionalId: 'tx-3' });
    await p.connect();
    await p.initTransactions();
    await expect(
      p.send({ topic: 't', messages: [{ value: 'x' }] }),
    ).rejects.toThrow(/no active transaction/);
  });

  it('T-EOS-008 commit without a transaction throws', async () => {
    const kafka = createKafkaMock();
    const p = createTransactionalProducer({ kafka, transactionalId: 'tx-4' });
    await p.connect();
    await p.initTransactions();
    await expect(p.commitTransaction()).rejects.toThrow(/no active transaction/);
  });

  it('T-EOS-009 double init throws', async () => {
    const kafka = createKafkaMock();
    const p = createTransactionalProducer({ kafka, transactionalId: 'tx-5' });
    await p.connect();
    await p.initTransactions();
    await expect(p.initTransactions()).rejects.toThrow(/already initialized/);
  });
});

describe('createReadCommittedFilter', () => {
  it('T-EOS-010 default filter is read-committed', () => {
    const filter = createReadCommittedFilter();
    expect(filter.isolationLevel).toBe('read-committed');
  });

  it('T-EOS-011 filter is identity on already-committed stream', () => {
    const filter = createReadCommittedFilter();
    const messages = [
      { topic: 't', partition: 0, offset: 0, timestamp: 0, key: null, value: 'a', headers: {} },
    ] as const;
    expect(filter.filter(messages)).toEqual(messages);
  });
});
