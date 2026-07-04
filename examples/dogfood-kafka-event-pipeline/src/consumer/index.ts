/**
 * Kafka consumer flow — consumer group with offset commit + rebalance
 * callback. Two consumers join the same group, share the partition topology,
 * and both are notified when a rebalance shifts assignments.
 *
 * Offset commit is opt-in per handler — auto-commit works like kafkajs's
 * default, manual commit uses `commitOffsets` after batch processing.
 */

import type {
  ConsumerConfig,
  KafkaConsumer,
  KafkaMock,
  StreamingMessage,
} from '@kiwa-test/streaming';

export interface ConsumedEnvelope<TValue = unknown> {
  readonly consumerId: string;
  readonly topic: string;
  readonly partition: number;
  readonly offset: number;
  readonly value: TValue;
}

export interface RebalanceEvent {
  readonly consumerId: string;
  readonly assignments: ReadonlyMap<string, readonly number[]>;
  readonly triggeredAt: number;
}

export interface ConsumerRun {
  readonly consumer: KafkaConsumer;
  readonly consumerId: string;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly subscribe: (
    topics: readonly string[],
    opts?: { readonly fromBeginning?: boolean },
  ) => Promise<RebalanceEvent>;
  readonly consume: (opts: {
    readonly autoCommit: boolean;
  }) => Promise<readonly ConsumedEnvelope[]>;
  readonly commit: (
    offsets: readonly { readonly topic: string; readonly partition: number; readonly offset: number }[],
  ) => Promise<void>;
  readonly rebalances: () => readonly RebalanceEvent[];
}

let consumerCounter = 0;

/**
 * Build one consumer that participates in a group. Every call assigns a
 * stable consumerId — the mock uses this as the memberId when it rebalances
 * partitions across the group's members.
 */
export function createConsumerRun(
  kafka: KafkaMock,
  config: ConsumerConfig,
  opts?: { readonly consumerId?: string },
): ConsumerRun {
  consumerCounter += 1;
  const consumerId = opts?.consumerId ?? `consumer-${consumerCounter}`;
  const consumer = kafka.consumer(config);
  const rebalanceHistory: RebalanceEvent[] = [];

  async function subscribe(
    topics: readonly string[],
    subscribeOpts?: { readonly fromBeginning?: boolean },
  ): Promise<RebalanceEvent> {
    const opts: { readonly topics: readonly string[]; readonly fromBeginning?: boolean } =
      subscribeOpts?.fromBeginning !== undefined
        ? { topics, fromBeginning: subscribeOpts.fromBeginning }
        : { topics };
    await consumer.subscribe(opts);
    const event: RebalanceEvent = {
      consumerId,
      assignments: consumer.assignments(),
      triggeredAt: Date.now(),
    };
    rebalanceHistory.push(event);
    return event;
  }

  async function consume(opts: { readonly autoCommit: boolean }): Promise<readonly ConsumedEnvelope[]> {
    const collected: ConsumedEnvelope[] = [];
    await consumer.run({
      autoCommit: opts.autoCommit,
      eachMessage: (message: StreamingMessage) => {
        collected.push({
          consumerId,
          topic: message.topic,
          partition: message.partition,
          offset: message.offset,
          value: message.value,
        });
      },
    });
    return collected;
  }

  async function commit(
    offsets: readonly { readonly topic: string; readonly partition: number; readonly offset: number }[],
  ): Promise<void> {
    await consumer.commitOffsets(
      offsets.map((o) => ({ topic: o.topic, partition: o.partition, offset: o.offset })),
    );
  }

  return {
    consumer,
    consumerId,
    connect: () => consumer.connect(),
    disconnect: () => consumer.disconnect(),
    subscribe,
    consume,
    commit,
    rebalances: () => [...rebalanceHistory],
  };
}
