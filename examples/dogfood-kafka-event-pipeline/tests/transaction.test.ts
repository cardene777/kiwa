import { createKafkaMock } from '@kiwa-lab/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createTransactionRun } from '../src/transaction/index.js';

let kafkaRef: ReturnType<typeof createKafkaMock> | null = null;

afterEach(() => {
  kafkaRef?.reset();
  kafkaRef = null;
});

function makeMock() {
  const kafka = createKafkaMock({ defaultPartitionCount: 1 });
  kafkaRef = kafka;
  return kafka;
}

describe('transaction flow — exactly-once transactional producer + read-committed', () => {
  it('T-DKT-001 commit lands the batched sends on the broker', async () => {
    const kafka = makeMock();
    const run = createTransactionRun(kafka, 'txn-1');
    await run.connect();
    const result = await run.runCommit('txn-topic', ['a', 'b', 'c']);
    expect(result.state).toBe('committed');
    const messages = kafka.getTopicMessages('txn-topic');
    expect(messages.map((m) => m.value)).toEqual(['a', 'b', 'c']);
    await run.disconnect();
  });

  it('T-DKT-002 abort discards the batch — broker sees nothing from that transaction', async () => {
    const kafka = makeMock();
    const run = createTransactionRun(kafka, 'txn-2');
    await run.connect();
    // First commit a known baseline so we can assert the abort does not add.
    await run.runCommit('txn-topic', ['baseline']);
    await run.runAbort('txn-topic', ['aborted-1', 'aborted-2']);
    const messages = kafka.getTopicMessages('txn-topic');
    expect(messages.map((m) => m.value)).toEqual(['baseline']);
    await run.disconnect();
  });

  it('T-DKT-003 read-committed filter keeps committed messages (identity in mock)', async () => {
    const kafka = makeMock();
    const run = createTransactionRun(kafka, 'txn-3');
    await run.connect();
    await run.runCommit('txn-topic', ['x', 'y']);
    const messages = kafka.getTopicMessages('txn-topic');
    const filtered = run.filterCommitted(messages);
    expect(filtered.length).toBe(2);
    expect(filtered.map((m) => m.value)).toEqual(['x', 'y']);
    await run.disconnect();
  });

  it('T-DKT-004 begin without init throws (state machine)', async () => {
    const kafka = makeMock();
    const run = createTransactionRun(kafka, 'txn-4');
    await run.connect();
    await expect(run.producer.beginTransaction()).rejects.toThrow(/initTransactions/);
    await run.disconnect();
  });

  it('T-DKT-005 commit → begin can start a new transaction with the same producer', async () => {
    const kafka = makeMock();
    const run = createTransactionRun(kafka, 'txn-5');
    await run.connect();
    await run.runCommit('t1', ['1']);
    await run.runCommit('t1', ['2']);
    expect(kafka.getTopicMessages('t1').map((m) => m.value)).toEqual(['1', '2']);
    await run.disconnect();
  });
});
