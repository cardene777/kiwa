// Exactly-once semantics test adapter — wraps a KafkaMock producer/consumer
// with idempotent producer (dedup by producer id + sequence), transactional
// producer (init / begin / commit / abort), and read-committed consumer
// (skips aborted transaction records). Modeled after kafkajs's transactional
// producer contract so tests can validate exactly-once end-to-end.

import type { KafkaMock, KafkaProducer, ProducerRecord } from './kafka.js';
import type { PublishResult, StreamingMessage } from './types.js';

export const IDEMPOTENT_PRODUCER_SYMBOL = Symbol.for('kiwa.streaming.exactly-once.idempotent');
export const TRANSACTIONAL_PRODUCER_SYMBOL = Symbol.for('kiwa.streaming.exactly-once.transactional');
export const READ_COMMITTED_SYMBOL = Symbol.for('kiwa.streaming.exactly-once.read-committed');

export interface IdempotentProducerConfig {
  readonly kafka: KafkaMock;
  /** Producer identity used for dedup. In real Kafka this is broker-assigned. */
  readonly producerId?: string;
}

export interface IdempotentProducer {
  readonly [IDEMPOTENT_PRODUCER_SYMBOL]: true;
  readonly producerId: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send<TValue = unknown, TKey = string>(
    record: ProducerRecord<TValue, TKey>,
    sequenceNumber: number,
  ): Promise<PublishResult[]>;
  /** Returns true when the (producerId, sequenceNumber) has already been observed. */
  isDuplicate(sequenceNumber: number): boolean;
}

/**
 * Idempotent producer — dedups (producerId, sequenceNumber) pairs so retries
 * from the client side don't produce double writes. Kafka's real
 * implementation stores (pid, seq) → last offset per partition; the mock
 * uses a single global set which is enough to model the observable behavior.
 */
export function createIdempotentProducer(config: IdempotentProducerConfig): IdempotentProducer {
  const kafkaProducer: KafkaProducer = config.kafka.producer();
  const seen = new Set<number>();
  const producerId = config.producerId ?? `producer-${Math.random().toString(36).slice(2, 10)}`;

  const producer: IdempotentProducer = {
    [IDEMPOTENT_PRODUCER_SYMBOL]: true,
    producerId,
    async connect() {
      await kafkaProducer.connect();
    },
    async disconnect() {
      await kafkaProducer.disconnect();
    },
    async send<TValue = unknown, TKey = string>(
      record: ProducerRecord<TValue, TKey>,
      sequenceNumber: number,
    ): Promise<PublishResult[]> {
      if (seen.has(sequenceNumber)) {
        // Duplicate — skip send but return prior contract shape so callers
        // don't have to special-case retries.
        return [];
      }
      seen.add(sequenceNumber);
      return kafkaProducer.send(record);
    },
    isDuplicate(sequenceNumber: number): boolean {
      return seen.has(sequenceNumber);
    },
  };
  return producer;
}

export interface TransactionalProducerConfig {
  readonly kafka: KafkaMock;
  readonly transactionalId: string;
}

export type TransactionState = 'idle' | 'active' | 'committed' | 'aborted';

export interface TransactionalProducer {
  readonly [TRANSACTIONAL_PRODUCER_SYMBOL]: true;
  readonly transactionalId: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  initTransactions(): Promise<void>;
  beginTransaction(): Promise<void>;
  send<TValue = unknown, TKey = string>(
    record: ProducerRecord<TValue, TKey>,
  ): Promise<PublishResult[]>;
  commitTransaction(): Promise<void>;
  abortTransaction(): Promise<void>;
  currentState(): TransactionState;
}

/**
 * Transactional producer — messages sent between beginTransaction() and
 * commitTransaction() are only visible to read-committed consumers after the
 * commit lands. abortTransaction() marks the batch aborted and read-committed
 * consumers skip it entirely.
 *
 * The mock defers the actual `producer.send()` until commit — this matches
 * the observable behavior read-committed consumers see, without modeling the
 * transaction coordinator's on-disk state.
 */
export function createTransactionalProducer(
  config: TransactionalProducerConfig,
): TransactionalProducer {
  const kafkaProducer: KafkaProducer = config.kafka.producer();
  let state: TransactionState = 'idle';
  let initialized = false;
  const pending: ProducerRecord[] = [];
  const abortedBatchIds = new Set<number>();
  let currentBatchId = 0;

  const producer: TransactionalProducer = {
    [TRANSACTIONAL_PRODUCER_SYMBOL]: true,
    transactionalId: config.transactionalId,
    async connect() {
      await kafkaProducer.connect();
    },
    async disconnect() {
      await kafkaProducer.disconnect();
    },
    async initTransactions() {
      if (initialized) throw new Error('transactional producer: already initialized');
      initialized = true;
      state = 'idle';
    },
    async beginTransaction() {
      if (!initialized) throw new Error('transactional producer: initTransactions() not called');
      if (state === 'active') {
        throw new Error('transactional producer: transaction already active');
      }
      state = 'active';
      currentBatchId += 1;
      pending.length = 0;
    },
    async send<TValue = unknown, TKey = string>(
      record: ProducerRecord<TValue, TKey>,
    ): Promise<PublishResult[]> {
      if (state !== 'active') {
        throw new Error('transactional producer: no active transaction');
      }
      pending.push(record as ProducerRecord);
      // Return provisional result shape — offsets are assigned on commit.
      return record.messages.map((_, i) => ({
        topic: record.topic,
        partition: 0,
        offset: -1 - i,
        timestamp: Date.now(),
      }));
    },
    async commitTransaction() {
      if (state !== 'active') {
        throw new Error('transactional producer: no active transaction to commit');
      }
      // Flush all pending records to the underlying kafka mock.
      for (const record of pending) {
        // eslint-disable-next-line no-await-in-loop
        await kafkaProducer.send(record);
      }
      pending.length = 0;
      state = 'committed';
    },
    async abortTransaction() {
      if (state !== 'active') {
        throw new Error('transactional producer: no active transaction to abort');
      }
      abortedBatchIds.add(currentBatchId);
      pending.length = 0;
      state = 'aborted';
    },
    currentState() {
      return state;
    },
  };
  return producer;
}

export type IsolationLevel = 'read-committed' | 'read-uncommitted';

export interface ReadCommittedFilter {
  readonly [READ_COMMITTED_SYMBOL]: true;
  readonly isolationLevel: IsolationLevel;
  /**
   * Filter a raw message stream to only committed records. The mock treats
   * every message emitted through `createTransactionalProducer.commit()` as
   * committed; uncommitted / aborted batches never reach the underlying
   * KafkaMock so this filter is effectively an identity for messages sourced
   * through the mock's own flow — but the shape mirrors kafkajs so tests can
   * assert against the same field.
   */
  filter<TValue = unknown, TKey = string>(
    messages: readonly StreamingMessage<TValue, TKey>[],
  ): readonly StreamingMessage<TValue, TKey>[];
}

/**
 * Read-committed filter — shaped like kafkajs's `isolationLevel: 'read_committed'`
 * consumer flag. In the mock, aborted transactions are never flushed to the
 * underlying broker so the filter is a no-op by construction; the identity
 * exists as a symmetric API surface for tests.
 */
export function createReadCommittedFilter(
  level: IsolationLevel = 'read-committed',
): ReadCommittedFilter {
  return {
    [READ_COMMITTED_SYMBOL]: true,
    isolationLevel: level,
    filter<TValue = unknown, TKey = string>(
      messages: readonly StreamingMessage<TValue, TKey>[],
    ): readonly StreamingMessage<TValue, TKey>[] {
      // In the mock, aborted batches are never persisted, so filtering by
      // "committed" is the identity operation. Left as a filter to preserve
      // the API surface tests expect.
      return messages;
    },
  };
}

/** Type guard: recognize an IdempotentProducer. */
export function isIdempotentProducer(value: unknown): value is IdempotentProducer {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [IDEMPOTENT_PRODUCER_SYMBOL]?: true })[IDEMPOTENT_PRODUCER_SYMBOL] === true
  );
}

/** Type guard: recognize a TransactionalProducer. */
export function isTransactionalProducer(value: unknown): value is TransactionalProducer {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [TRANSACTIONAL_PRODUCER_SYMBOL]?: true })[TRANSACTIONAL_PRODUCER_SYMBOL] === true
  );
}
