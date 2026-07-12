import { describe, expect, it } from 'vitest';
import {
  createIdempotentProducer,
  createKafkaMock,
  createReadCommittedFilter,
  createTransactionalProducer,
} from '../src/index.js';

// Follow-up file — closes the disconnect() branches on the idempotent + the
// transactional producer that exactly-once.test.ts doesn't hit.
// exactly-once.test.ts exercises the send / dedup / commit / abort flows but
// never calls .disconnect() on either producer.

describe('exactly-once producer disconnect surface', () => {
  it('T-EOS-B-001 idempotent producer disconnect flips the underlying producer to disconnected', async () => {
    const kafka = createKafkaMock();
    const producer = createIdempotentProducer({ kafka });
    await producer.connect();
    // Send once to prove send + dedup surface still works.
    await producer.send({ topic: 't', messages: [{ value: 'a' }] }, 1);
    // Disconnect triggers the underlying kafkaProducer.disconnect() branch.
    await producer.disconnect();
    // After disconnect, another send should hit the "before connect" guard on
    // the underlying producer.
    await expect(
      producer.send({ topic: 't', messages: [{ value: 'b' }] }, 2),
    ).rejects.toThrow(/producer\.send before connect/);
  });

  it('T-EOS-B-002 transactional producer disconnect exits without throwing', async () => {
    const kafka = createKafkaMock();
    const producer = createTransactionalProducer({ kafka, transactionalId: 'tx-b1' });
    await producer.connect();
    await producer.initTransactions();
    await producer.beginTransaction();
    await producer.send({ topic: 't', messages: [{ value: 'x' }] });
    await producer.commitTransaction();
    // Disconnect surface — this is the branch that was previously unhit.
    await expect(producer.disconnect()).resolves.toBeUndefined();
  });

  it('T-EOS-B-003 read-committed filter defaults to read-committed isolation', () => {
    const filter = createReadCommittedFilter();
    expect(filter.isolationLevel).toBe('read-committed');
    // Custom level survives.
    const uncommitted = createReadCommittedFilter('read-uncommitted');
    expect(uncommitted.isolationLevel).toBe('read-uncommitted');
  });

  it('T-EOS-B-004 idempotent producer send after dedup does not re-hit the kafka producer', async () => {
    const kafka = createKafkaMock();
    const producer = createIdempotentProducer({ kafka, producerId: 'stable-id' });
    await producer.connect();
    expect(producer.producerId).toBe('stable-id');
    await producer.send({ topic: 't', messages: [{ value: 'first' }] }, 7);
    const dup = await producer.send({ topic: 't', messages: [{ value: 'dup' }] }, 7);
    expect(dup).toEqual([]);
    expect(kafka.getTopicMessages('t')).toHaveLength(1);
  });
});
