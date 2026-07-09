/**
 * Kafka producer flow — idempotent producer with partition key + batch send.
 *
 * The producer path wraps `@kiwa-lab/streaming`'s idempotent producer so a
 * caller can retry the exact same (producerId, sequenceNumber) pair without
 * producing double writes. Partition assignment is deterministic per key
 * (the mock hashes the key with a murmur2-shaped intent).
 *
 * Batch sends group N records for a single write barrier — this mirrors the
 * kafkajs `producer.sendBatch` contract without modelling the wire protocol.
 */

import type {
  IdempotentProducer,
  KafkaMock,
  ProducerRecord,
  PublishResult,
} from '@kiwa-lab/streaming';
import { createIdempotentProducer } from '@kiwa-lab/streaming';

export interface OrderEvent {
  readonly orderId: string;
  readonly region: 'us' | 'eu' | 'apac';
  readonly total: number;
}

export interface ProducerRun {
  readonly producer: IdempotentProducer;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly publishOrder: (
    event: OrderEvent,
    sequence: number,
  ) => Promise<PublishResult[]>;
  readonly publishBatch: (
    topic: string,
    events: readonly OrderEvent[],
    startSequence: number,
  ) => Promise<PublishResult[]>;
  readonly duplicates: () => number;
}

/**
 * Build the producer run — one idempotent producer that dedups by sequence
 * number. `publishBatch` sends one record per event using the region as the
 * partition key so records for the same region land on the same partition.
 */
export function createProducerRun(kafka: KafkaMock, topic: string): ProducerRun {
  const producer = createIdempotentProducer({ kafka, producerId: 'producer-orders' });
  let duplicateAttempts = 0;

  async function publishOrder(event: OrderEvent, sequence: number): Promise<PublishResult[]> {
    const wasDuplicate = producer.isDuplicate(sequence);
    const record: ProducerRecord<OrderEvent> = {
      topic,
      messages: [
        {
          key: event.region,
          value: event,
          headers: { 'x-order-id': event.orderId },
        },
      ],
    };
    const result = await producer.send<OrderEvent>(record, sequence);
    if (wasDuplicate) duplicateAttempts += 1;
    return result;
  }

  async function publishBatch(
    batchTopic: string,
    events: readonly OrderEvent[],
    startSequence: number,
  ): Promise<PublishResult[]> {
    const results: PublishResult[] = [];
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      if (event === undefined) continue;
      const seq = startSequence + i;
      const wasDup = producer.isDuplicate(seq);
      const record: ProducerRecord<OrderEvent> = {
        topic: batchTopic,
        messages: [
          {
            key: event.region,
            value: event,
            headers: { 'x-order-id': event.orderId, 'x-batch': 'true' },
          },
        ],
      };
      // eslint-disable-next-line no-await-in-loop
      const sent = await producer.send<OrderEvent>(record, seq);
      if (wasDup) duplicateAttempts += 1;
      results.push(...sent);
    }
    return results;
  }

  return {
    producer,
    connect: () => producer.connect(),
    disconnect: () => producer.disconnect(),
    publishOrder,
    publishBatch,
    duplicates: () => duplicateAttempts,
  };
}
