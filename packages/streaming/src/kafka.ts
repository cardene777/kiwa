// Kafka test adapter — kafkajs API-shaped mock covering producer + consumer +
// admin + consumer-group semantics (partition assignment / offset commit /
// rebalance). Modeled to be shape-compatible with kafkajs (Producer / Consumer
// / Admin) so kiwa tests can swap `new Kafka({...}).producer()` for
// `createKafkaMock().producer()` without changing test code.
//
// Out of scope on purpose:
//   - real TCP wire protocol (mock is in-process, single-broker semantics)
//   - SSL / SASL negotiation (auth mocks stubbed at the config layer)
//   - real coordinator election (single-broker means partition owner is fixed)
//   - Kafka Streams / KSQL (only the core Consumer/Producer/Admin surface)

import type { MessageHandler, PublishResult, StreamingMessage } from './types.js';

export const KAFKA_MOCK_SYMBOL = Symbol.for('kiwa.streaming.kafka');
export const KAFKA_PRODUCER_SYMBOL = Symbol.for('kiwa.streaming.kafka.producer');
export const KAFKA_CONSUMER_SYMBOL = Symbol.for('kiwa.streaming.kafka.consumer');
export const KAFKA_ADMIN_SYMBOL = Symbol.for('kiwa.streaming.kafka.admin');

export type PartitionAssigner = 'range' | 'round-robin';

export interface KafkaMockConfig {
  readonly clientId?: string;
  readonly brokers?: readonly string[];
  /** Default partition count for auto-created topics. */
  readonly defaultPartitionCount?: number;
}

export interface KafkaTopicSpec {
  readonly topic: string;
  readonly numPartitions: number;
  /** Optional per-partition ownership map — group id → member id. */
  readonly assignments?: ReadonlyMap<number, string>;
}

export interface ProducerRecord<TValue = unknown, TKey = string> {
  readonly topic: string;
  readonly messages: readonly ProducerMessage<TValue, TKey>[];
}

export interface ProducerMessage<TValue = unknown, TKey = string> {
  readonly key?: TKey;
  readonly value: TValue;
  readonly partition?: number;
  readonly headers?: Record<string, string>;
  readonly timestamp?: number;
}

export interface ConsumerConfig {
  readonly groupId: string;
  readonly partitionAssigner?: PartitionAssigner;
  readonly sessionTimeoutMs?: number;
}

export interface KafkaProducer {
  readonly [KAFKA_PRODUCER_SYMBOL]: true;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send<TValue = unknown, TKey = string>(
    record: ProducerRecord<TValue, TKey>,
  ): Promise<PublishResult[]>;
  sendBatch(records: readonly ProducerRecord[]): Promise<PublishResult[]>;
  isConnected(): boolean;
}

export interface KafkaConsumer {
  readonly [KAFKA_CONSUMER_SYMBOL]: true;
  readonly groupId: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(opts: { readonly topics: readonly string[]; readonly fromBeginning?: boolean }): Promise<void>;
  run<TValue = unknown, TKey = string>(opts: {
    readonly eachMessage: MessageHandler<TValue, TKey>;
    readonly autoCommit?: boolean;
  }): Promise<void>;
  commitOffsets(offsets: readonly CommittedOffset[]): Promise<void>;
  seek(opts: { readonly topic: string; readonly partition: number; readonly offset: number }): void;
  assignments(): ReadonlyMap<string, readonly number[]>;
  isConnected(): boolean;
}

export interface CommittedOffset {
  readonly topic: string;
  readonly partition: number;
  readonly offset: number;
}

export interface KafkaAdmin {
  readonly [KAFKA_ADMIN_SYMBOL]: true;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  createTopics(opts: {
    readonly topics: readonly {
      readonly topic: string;
      readonly numPartitions?: number;
    }[];
  }): Promise<void>;
  listTopics(): Promise<string[]>;
  deleteTopics(opts: { readonly topics: readonly string[] }): Promise<void>;
  fetchTopicMetadata(opts: {
    readonly topics: readonly string[];
  }): Promise<{ readonly topics: readonly KafkaTopicSpec[] }>;
}

export interface KafkaMock {
  readonly [KAFKA_MOCK_SYMBOL]: true;
  readonly config: KafkaMockConfig;
  producer(): KafkaProducer;
  consumer(config: ConsumerConfig): KafkaConsumer;
  admin(): KafkaAdmin;
  /** Reset all producers / consumers / topics — useful between test cases. */
  reset(): void;
  /** Direct topic access for lower-level assertions. */
  getTopicMessages(topic: string): readonly StreamingMessage[];
  getCommittedOffset(groupId: string, topic: string, partition: number): number | undefined;
}

interface TopicState {
  readonly topic: string;
  readonly numPartitions: number;
  /** partition → append-only log of messages. */
  readonly partitions: Map<number, StreamingMessage[]>;
}

interface ConsumerGroupState {
  readonly groupId: string;
  /** topic → partition → committed offset (next to consume). */
  readonly offsets: Map<string, Map<number, number>>;
  /** consumer id → subscribed topics. */
  readonly members: Map<string, Set<string>>;
  /** memberId → topic → assigned partitions. Shared across consumers so rebalances propagate. */
  readonly memberAssignments: Map<string, Map<string, number[]>>;
}

/**
 * Create a Kafka-shaped mock — the object returned mirrors the surface of
 * `new Kafka({...})` from the `kafkajs` package. Every producer / consumer /
 * admin issued from the same mock shares topic state so tests can write in one
 * client and assert in another.
 */
export function createKafkaMock(config?: KafkaMockConfig): KafkaMock {
  const cfg: KafkaMockConfig = config ?? {};
  const defaultPartitions = cfg.defaultPartitionCount ?? 1;
  const topics = new Map<string, TopicState>();
  const groups = new Map<string, ConsumerGroupState>();

  function ensureTopic(topic: string, numPartitions?: number): TopicState {
    const existing = topics.get(topic);
    if (existing) return existing;
    const parts = numPartitions ?? defaultPartitions;
    const partitions = new Map<number, StreamingMessage[]>();
    for (let i = 0; i < parts; i += 1) partitions.set(i, []);
    const state: TopicState = { topic, numPartitions: parts, partitions };
    topics.set(topic, state);
    return state;
  }

  function ensureGroup(groupId: string): ConsumerGroupState {
    const existing = groups.get(groupId);
    if (existing) return existing;
    const state: ConsumerGroupState = {
      groupId,
      offsets: new Map(),
      members: new Map(),
      memberAssignments: new Map(),
    };
    groups.set(groupId, state);
    return state;
  }

  function pickPartition(topic: TopicState, key: string | null | undefined, explicit?: number): number {
    if (explicit !== undefined) {
      if (explicit < 0 || explicit >= topic.numPartitions) {
        throw new Error(
          `kafka mock: partition ${explicit} out of range 0..${topic.numPartitions - 1} for topic "${topic.topic}"`,
        );
      }
      return explicit;
    }
    if (key === null || key === undefined) {
      // Sticky partitioner (round-robin) — deterministic via total count.
      let total = 0;
      for (const list of topic.partitions.values()) total += list.length;
      return total % topic.numPartitions;
    }
    // Simple hash — matches kafkajs `murmur2` intent (deterministic per key).
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % topic.numPartitions;
  }

  function appendMessage<TValue, TKey>(
    topic: TopicState,
    partition: number,
    key: TKey | undefined,
    value: TValue,
    headers?: Record<string, string>,
    timestamp?: number,
  ): PublishResult {
    const list = topic.partitions.get(partition);
    if (!list) throw new Error(`kafka mock: partition ${partition} missing on "${topic.topic}"`);
    const offset = list.length;
    const ts = timestamp ?? Date.now();
    const msg: StreamingMessage<TValue, TKey> = {
      topic: topic.topic,
      partition,
      offset,
      timestamp: ts,
      key: (key ?? null) as TKey | null,
      value,
      headers: headers ?? {},
    };
    list.push(msg as unknown as StreamingMessage);
    return { topic: topic.topic, partition, offset, timestamp: ts };
  }

  function assignPartitionsToMembers(
    topicName: string,
    memberIds: readonly string[],
    strategy: PartitionAssigner,
  ): Map<string, number[]> {
    const topic = topics.get(topicName);
    const assignments = new Map<string, number[]>();
    if (!topic || memberIds.length === 0) {
      for (const id of memberIds) assignments.set(id, []);
      return assignments;
    }
    const partitionCount = topic.numPartitions;
    for (const id of memberIds) assignments.set(id, []);
    if (strategy === 'round-robin') {
      for (let p = 0; p < partitionCount; p += 1) {
        const memberIndex = p % memberIds.length;
        const target = memberIds[memberIndex];
        if (target === undefined) continue;
        const bucket = assignments.get(target);
        if (bucket) bucket.push(p);
      }
    } else {
      // range assigner — split partitions in contiguous blocks per member.
      const perMember = Math.ceil(partitionCount / memberIds.length);
      for (let m = 0; m < memberIds.length; m += 1) {
        const memberId = memberIds[m];
        if (memberId === undefined) continue;
        const start = m * perMember;
        const end = Math.min(start + perMember, partitionCount);
        for (let p = start; p < end; p += 1) {
          const bucket = assignments.get(memberId);
          if (bucket) bucket.push(p);
        }
      }
    }
    return assignments;
  }

  const mock: KafkaMock = {
    [KAFKA_MOCK_SYMBOL]: true,
    config: cfg,
    producer(): KafkaProducer {
      let connected = false;
      const producer: KafkaProducer = {
        [KAFKA_PRODUCER_SYMBOL]: true,
        async connect() {
          connected = true;
        },
        async disconnect() {
          connected = false;
        },
        async send<TValue = unknown, TKey = string>(
          record: ProducerRecord<TValue, TKey>,
        ): Promise<PublishResult[]> {
          if (!connected) throw new Error('kafka mock: producer.send before connect');
          const topic = ensureTopic(record.topic);
          const results: PublishResult[] = [];
          for (const m of record.messages) {
            const partition = pickPartition(topic, (m.key as unknown as string) ?? null, m.partition);
            const key = m.key === undefined ? undefined : m.key;
            const result = appendMessage(topic, partition, key, m.value, m.headers, m.timestamp);
            results.push(result);
          }
          return results;
        },
        async sendBatch(records) {
          const flat: PublishResult[] = [];
          for (const r of records) {
            // eslint-disable-next-line no-await-in-loop
            const sent = await producer.send(r);
            flat.push(...sent);
          }
          return flat;
        },
        isConnected() {
          return connected;
        },
      };
      return producer;
    },
    consumer(consumerConfig: ConsumerConfig): KafkaConsumer {
      const memberId = `consumer-${Math.random().toString(36).slice(2, 10)}`;
      const strategy: PartitionAssigner = consumerConfig.partitionAssigner ?? 'range';
      const group = ensureGroup(consumerConfig.groupId);
      let connected = false;
      let subscribedTopics: string[] = [];
      const seekOverrides = new Map<string, Map<number, number>>();

      // Ensure this consumer has an entry in the group-shared assignment map.
      const myAssignments = (): Map<string, number[]> => {
        let mine = group.memberAssignments.get(memberId);
        if (!mine) {
          mine = new Map();
          group.memberAssignments.set(memberId, mine);
        }
        return mine;
      };

      const rebalance = (): void => {
        group.members.set(memberId, new Set(subscribedTopics));
        // Union of all topics subscribed by any group member — a rebalance
        // must repartition every topic the group touches, not just this
        // consumer's subscriptions.
        const allTopics = new Set<string>();
        for (const topicsForMember of group.members.values()) {
          for (const t of topicsForMember) allTopics.add(t);
        }
        for (const topicName of allTopics) {
          const members: string[] = [];
          for (const [id, topicsForMember] of group.members) {
            if (topicsForMember.has(topicName)) members.push(id);
          }
          members.sort();
          const perTopic = assignPartitionsToMembers(topicName, members, strategy);
          // Distribute the new partition assignment to every member so their
          // subsequent run() calls read the updated view.
          for (const [id, partitions] of perTopic) {
            let bucket = group.memberAssignments.get(id);
            if (!bucket) {
              bucket = new Map();
              group.memberAssignments.set(id, bucket);
            }
            bucket.set(topicName, partitions);
          }
        }
      };

      const consumer: KafkaConsumer = {
        [KAFKA_CONSUMER_SYMBOL]: true,
        groupId: consumerConfig.groupId,
        async connect() {
          connected = true;
        },
        async disconnect() {
          connected = false;
          group.members.delete(memberId);
          group.memberAssignments.delete(memberId);
        },
        async subscribe(opts) {
          if (!connected) throw new Error('kafka mock: consumer.subscribe before connect');
          subscribedTopics = [...opts.topics];
          for (const t of subscribedTopics) ensureTopic(t);
          rebalance();
          if (opts.fromBeginning) {
            // Rewind committed offsets to 0.
            for (const topicName of subscribedTopics) {
              const perTopic = group.offsets.get(topicName) ?? new Map<number, number>();
              const partitions = myAssignments().get(topicName) ?? [];
              for (const p of partitions) perTopic.set(p, 0);
              group.offsets.set(topicName, perTopic);
            }
          }
        },
        async run(opts) {
          if (!connected) throw new Error('kafka mock: consumer.run before connect');
          const autoCommit = opts.autoCommit !== false;
          for (const topicName of subscribedTopics) {
            const topic = topics.get(topicName);
            if (!topic) continue;
            const partitions = myAssignments().get(topicName) ?? [];
            const perTopic = group.offsets.get(topicName) ?? new Map<number, number>();
            const seekPerTopic = seekOverrides.get(topicName);
            for (const p of partitions) {
              const startOffset = seekPerTopic?.get(p) ?? perTopic.get(p) ?? 0;
              const list = topic.partitions.get(p) ?? [];
              for (let i = startOffset; i < list.length; i += 1) {
                const message = list[i];
                if (message === undefined) continue;
                // The mock stores messages as `StreamingMessage<unknown>`; the
                // handler is generic over the caller's TValue/TKey. Casting
                // here mirrors kafkajs which pipes raw wire bytes through the
                // same handler signature.
                // eslint-disable-next-line no-await-in-loop
                await (opts.eachMessage as MessageHandler)(message as StreamingMessage);
                if (autoCommit) {
                  perTopic.set(p, i + 1);
                }
              }
            }
            group.offsets.set(topicName, perTopic);
          }
          seekOverrides.clear();
        },
        async commitOffsets(offsets) {
          for (const o of offsets) {
            const perTopic = group.offsets.get(o.topic) ?? new Map<number, number>();
            perTopic.set(o.partition, o.offset);
            group.offsets.set(o.topic, perTopic);
          }
        },
        seek(opts) {
          const perTopic = seekOverrides.get(opts.topic) ?? new Map<number, number>();
          perTopic.set(opts.partition, opts.offset);
          seekOverrides.set(opts.topic, perTopic);
        },
        assignments() {
          const out = new Map<string, readonly number[]>();
          for (const [topic, parts] of myAssignments()) out.set(topic, [...parts]);
          return out;
        },
        isConnected() {
          return connected;
        },
      };
      return consumer;
    },
    admin(): KafkaAdmin {
      let connected = false;
      const admin: KafkaAdmin = {
        [KAFKA_ADMIN_SYMBOL]: true,
        async connect() {
          connected = true;
        },
        async disconnect() {
          connected = false;
        },
        async createTopics(opts) {
          if (!connected) throw new Error('kafka mock: admin.createTopics before connect');
          for (const t of opts.topics) {
            ensureTopic(t.topic, t.numPartitions);
          }
        },
        async listTopics() {
          if (!connected) throw new Error('kafka mock: admin.listTopics before connect');
          return [...topics.keys()];
        },
        async deleteTopics(opts) {
          if (!connected) throw new Error('kafka mock: admin.deleteTopics before connect');
          for (const t of opts.topics) topics.delete(t);
        },
        async fetchTopicMetadata(opts) {
          if (!connected) throw new Error('kafka mock: admin.fetchTopicMetadata before connect');
          const out: KafkaTopicSpec[] = [];
          for (const name of opts.topics) {
            const topic = topics.get(name);
            if (!topic) throw new Error(`kafka mock: unknown topic "${name}"`);
            out.push({ topic: topic.topic, numPartitions: topic.numPartitions });
          }
          return { topics: out };
        },
      };
      return admin;
    },
    reset() {
      topics.clear();
      groups.clear();
    },
    getTopicMessages(topic) {
      const state = topics.get(topic);
      if (!state) return [];
      const all: StreamingMessage[] = [];
      for (const partition of [...state.partitions.keys()].sort((a, b) => a - b)) {
        const list = state.partitions.get(partition);
        if (list) all.push(...list);
      }
      return all;
    },
    getCommittedOffset(groupId, topic, partition) {
      const group = groups.get(groupId);
      if (!group) return undefined;
      const perTopic = group.offsets.get(topic);
      if (!perTopic) return undefined;
      return perTopic.get(partition);
    },
  };
  return mock;
}

/** Type guard: recognize a KafkaMock. */
export function isKafkaMock(value: unknown): value is KafkaMock {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [KAFKA_MOCK_SYMBOL]?: true })[KAFKA_MOCK_SYMBOL] === true
  );
}
