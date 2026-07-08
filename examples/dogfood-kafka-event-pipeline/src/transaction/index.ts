/**
 * Kafka exactly-once flow — transactional producer + read-committed consumer.
 *
 * The transactional producer defers writes until commit — aborts never reach
 * the underlying broker. Read-committed consumers only see committed batches,
 * which is what an exactly-once end-to-end pipeline needs.
 *
 * The flow bundles 2 concerns: (1) begin/send/commit-or-abort semantics,
 * (2) filtering the consumed stream through the read-committed filter so
 * tests can assert on the observable exactly-once behaviour.
 */

import type {
  IsolationLevel,
  KafkaMock,
  ProducerRecord,
  ReadCommittedFilter,
  StreamingMessage,
  TransactionalProducer,
} from '@kiwa/streaming';
import {
  createReadCommittedFilter,
  createTransactionalProducer,
} from '@kiwa/streaming';

export interface TransactionRun {
  readonly producer: TransactionalProducer;
  readonly filter: ReadCommittedFilter;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly runCommit: (
    topic: string,
    values: readonly unknown[],
  ) => Promise<{ readonly state: string }>;
  readonly runAbort: (
    topic: string,
    values: readonly unknown[],
  ) => Promise<{ readonly state: string }>;
  readonly filterCommitted: (
    messages: readonly StreamingMessage[],
  ) => readonly StreamingMessage[];
}

/**
 * Build the transaction run. Every commit lands the batched sends on the
 * underlying kafka mock in the order they were queued; aborts drop the
 * pending batch entirely.
 */
export function createTransactionRun(
  kafka: KafkaMock,
  transactionalId: string,
  isolationLevel: IsolationLevel = 'read-committed',
): TransactionRun {
  const producer = createTransactionalProducer({ kafka, transactionalId });
  const filter = createReadCommittedFilter(isolationLevel);

  let initialized = false;

  async function ensureInitialized(): Promise<void> {
    if (initialized) return;
    await producer.initTransactions();
    initialized = true;
  }

  async function runCommit(
    topic: string,
    values: readonly unknown[],
  ): Promise<{ readonly state: string }> {
    await ensureInitialized();
    await producer.beginTransaction();
    for (const value of values) {
      const record: ProducerRecord = {
        topic,
        messages: [{ value }],
      };
      // eslint-disable-next-line no-await-in-loop
      await producer.send(record);
    }
    await producer.commitTransaction();
    return { state: producer.currentState() };
  }

  async function runAbort(
    topic: string,
    values: readonly unknown[],
  ): Promise<{ readonly state: string }> {
    await ensureInitialized();
    await producer.beginTransaction();
    for (const value of values) {
      const record: ProducerRecord = {
        topic,
        messages: [{ value }],
      };
      // eslint-disable-next-line no-await-in-loop
      await producer.send(record);
    }
    await producer.abortTransaction();
    return { state: producer.currentState() };
  }

  return {
    producer,
    filter,
    connect: () => producer.connect(),
    disconnect: () => producer.disconnect(),
    runCommit,
    runAbort,
    filterCommitted: (messages) => filter.filter(messages),
  };
}
