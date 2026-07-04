// NATS test adapter — nats.js API-shaped mock covering core pub/sub +
// JetStream persistent streams + KV bucket + Object Store bucket + subject
// routing (`>` catch-all + `*` single-token wildcards).
//
// The wire model is different from Kafka: subject-based routing (`orders.*`)
// instead of topics + partitions. JetStream sits on top and adds durability
// per stream. KV / Object Store are convenience abstractions layered on
// JetStream in real NATS; the mock exposes them as first-class stores.

import type { MessageHandler, PublishResult, StreamingMessage } from './types.js';

export const NATS_MOCK_SYMBOL = Symbol.for('kiwa.streaming.nats');
export const NATS_JETSTREAM_SYMBOL = Symbol.for('kiwa.streaming.nats.jetstream');
export const NATS_KV_SYMBOL = Symbol.for('kiwa.streaming.nats.kv');
export const NATS_OBJECT_SYMBOL = Symbol.for('kiwa.streaming.nats.object');

export interface NatsMockConfig {
  readonly servers?: readonly string[];
  readonly name?: string;
}

export interface NatsPublishOptions {
  readonly headers?: Record<string, string>;
  readonly reply?: string;
}

export interface NatsSubscription {
  readonly subject: string;
  unsubscribe(): void;
  isClosed(): boolean;
}

export interface JetStreamConfig {
  readonly name: string;
  readonly subjects: readonly string[];
  /** Retention policy — `limits` = size/time based, `interest` = consumer-based, `workqueue` = consume-once. */
  readonly retention?: 'limits' | 'interest' | 'workqueue';
  readonly maxMsgs?: number;
}

export interface JetStreamPublishAck {
  readonly stream: string;
  readonly seq: number;
  readonly duplicate: boolean;
}

export interface JetStreamConsumerConfig {
  readonly durable: string;
  readonly filterSubject?: string;
  readonly ackPolicy?: 'explicit' | 'none' | 'all';
}

export interface JetStreamConsumer {
  readonly durable: string;
  fetch(batch: number): Promise<StreamingMessage[]>;
  ack(message: StreamingMessage): void;
  info(): { readonly delivered: number; readonly ackFloor: number };
}

export interface JetStreamStore {
  readonly [NATS_JETSTREAM_SYMBOL]: true;
  addStream(config: JetStreamConfig): Promise<void>;
  publish<TValue = unknown>(subject: string, data: TValue): Promise<JetStreamPublishAck>;
  consumer(streamName: string, config: JetStreamConsumerConfig): Promise<JetStreamConsumer>;
  listStreams(): readonly string[];
  getStreamMessages(streamName: string): readonly StreamingMessage[];
}

export interface KVStore {
  readonly [NATS_KV_SYMBOL]: true;
  readonly bucket: string;
  put<TValue = unknown>(key: string, value: TValue): Promise<number>;
  get<TValue = unknown>(key: string): Promise<KVEntry<TValue> | null>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  watch(): AsyncIterable<KVEntry>;
}

export interface KVEntry<TValue = unknown> {
  readonly bucket: string;
  readonly key: string;
  readonly value: TValue;
  readonly revision: number;
  readonly timestamp: number;
}

export interface ObjectStore {
  readonly [NATS_OBJECT_SYMBOL]: true;
  readonly bucket: string;
  put(name: string, data: Uint8Array | string): Promise<ObjectInfo>;
  get(name: string): Promise<ObjectEntry | null>;
  delete(name: string): Promise<void>;
  list(): Promise<ObjectInfo[]>;
}

export interface ObjectInfo {
  readonly bucket: string;
  readonly name: string;
  readonly size: number;
  readonly digest: string;
  readonly timestamp: number;
}

export interface ObjectEntry {
  readonly info: ObjectInfo;
  readonly data: Uint8Array;
}

export interface NatsMock {
  readonly [NATS_MOCK_SYMBOL]: true;
  readonly config: NatsMockConfig;
  publish<TValue = unknown>(
    subject: string,
    data: TValue,
    options?: NatsPublishOptions,
  ): Promise<PublishResult>;
  subscribe<TValue = unknown>(subject: string, handler: MessageHandler<TValue>): NatsSubscription;
  request<TIn = unknown, TOut = unknown>(subject: string, data: TIn): Promise<StreamingMessage<TOut>>;
  jetstream(): JetStreamStore;
  kv(bucket: string): KVStore;
  objectStore(bucket: string): ObjectStore;
  drain(): Promise<void>;
  reset(): void;
  getSubjectMessages(subject: string): readonly StreamingMessage[];
}

interface CoreSubscription {
  readonly subject: string;
  readonly matcher: SubjectMatcher;
  readonly handler: MessageHandler;
  active: boolean;
}

interface JetStreamState {
  readonly config: JetStreamConfig;
  readonly messages: StreamingMessage[];
  readonly consumers: Map<string, JetStreamConsumerState>;
}

interface JetStreamConsumerState {
  readonly config: JetStreamConsumerConfig;
  delivered: number;
  ackFloor: number;
  pending: Set<number>;
}

interface SubjectMatcher {
  readonly regex: RegExp;
}

/**
 * Compile a NATS subject pattern (`orders.>`, `orders.*.created`) into a
 * regex. `*` matches exactly one token, `>` matches one or more trailing
 * tokens. Literal matches are supported as-is.
 */
export function compileSubject(pattern: string): SubjectMatcher {
  const parts = pattern.split('.');
  const regexParts = parts.map((part, index) => {
    if (part === '>') {
      // `>` must be the last token; matches one or more remaining tokens.
      if (index !== parts.length - 1) {
        throw new Error(`nats mock: '>' wildcard must be the last token in "${pattern}"`);
      }
      return '.+';
    }
    if (part === '*') return '[^.]+';
    return escapeRegex(part);
  });
  return { regex: new RegExp(`^${regexParts.join('\\.')}$`) };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Match a subject against a compiled pattern. */
export function matchSubject(matcher: SubjectMatcher, subject: string): boolean {
  return matcher.regex.test(subject);
}

/**
 * Create a NATS-shaped mock — the returned object mirrors the surface of
 * `connect({...})` from the `nats` package. All subscriptions / streams /
 * stores share one instance so tests can publish in one place and observe
 * in another.
 */
export function createNatsMock(config?: NatsMockConfig): NatsMock {
  const cfg: NatsMockConfig = config ?? {};
  const subscriptions: CoreSubscription[] = [];
  const messages: StreamingMessage[] = [];
  const jetstreamStreams = new Map<string, JetStreamState>();
  const kvBuckets = new Map<string, Map<string, KVEntry>>();
  const kvRevisions = new Map<string, number>();
  const objectBuckets = new Map<string, Map<string, ObjectEntry>>();
  let requestCounter = 0;

  async function fanout<TValue>(msg: StreamingMessage<TValue>): Promise<void> {
    // Deliver synchronously — tests want deterministic ordering.
    for (const sub of subscriptions) {
      if (!sub.active) continue;
      if (matchSubject(sub.matcher, msg.topic)) {
        // eslint-disable-next-line no-await-in-loop
        await sub.handler(msg as StreamingMessage);
      }
    }
  }

  const jetstream: JetStreamStore = {
    [NATS_JETSTREAM_SYMBOL]: true,
    async addStream(streamConfig: JetStreamConfig): Promise<void> {
      if (streamConfig.subjects.length === 0) {
        throw new Error('jetstream: stream must declare at least one subject');
      }
      jetstreamStreams.set(streamConfig.name, {
        config: streamConfig,
        messages: [],
        consumers: new Map(),
      });
    },
    async publish<TValue = unknown>(subject: string, data: TValue): Promise<JetStreamPublishAck> {
      const stream = findStreamForSubject(jetstreamStreams, subject);
      if (!stream) {
        throw new Error(`jetstream: no stream matches subject "${subject}"`);
      }
      const seq = stream.messages.length + 1;
      const msg: StreamingMessage<TValue> = {
        topic: subject,
        partition: 0,
        offset: seq,
        timestamp: Date.now(),
        key: null,
        value: data,
        headers: {},
      };
      stream.messages.push(msg as unknown as StreamingMessage);
      if (stream.config.maxMsgs !== undefined && stream.messages.length > stream.config.maxMsgs) {
        stream.messages.shift();
      }
      return { stream: stream.config.name, seq, duplicate: false };
    },
    async consumer(streamName: string, consumerConfig: JetStreamConsumerConfig): Promise<JetStreamConsumer> {
      const stream = jetstreamStreams.get(streamName);
      if (!stream) throw new Error(`jetstream: stream "${streamName}" not found`);
      const state: JetStreamConsumerState = {
        config: consumerConfig,
        delivered: 0,
        ackFloor: 0,
        pending: new Set(),
      };
      stream.consumers.set(consumerConfig.durable, state);
      const consumer: JetStreamConsumer = {
        durable: consumerConfig.durable,
        async fetch(batch: number): Promise<StreamingMessage[]> {
          const out: StreamingMessage[] = [];
          const filter = consumerConfig.filterSubject;
          for (let i = state.delivered; i < stream.messages.length && out.length < batch; i += 1) {
            const message = stream.messages[i];
            if (message === undefined) continue;
            if (filter !== undefined) {
              const matcher = compileSubject(filter);
              if (!matchSubject(matcher, message.topic)) continue;
            }
            out.push(message);
            state.pending.add(i);
            state.delivered = i + 1;
          }
          return out;
        },
        ack(message: StreamingMessage): void {
          const idx = stream.messages.indexOf(message);
          if (idx >= 0) {
            state.pending.delete(idx);
            if (state.pending.size === 0) state.ackFloor = state.delivered;
          }
        },
        info() {
          return { delivered: state.delivered, ackFloor: state.ackFloor };
        },
      };
      return consumer;
    },
    listStreams(): readonly string[] {
      return [...jetstreamStreams.keys()];
    },
    getStreamMessages(streamName: string): readonly StreamingMessage[] {
      return jetstreamStreams.get(streamName)?.messages ?? [];
    },
  };

  const mock: NatsMock = {
    [NATS_MOCK_SYMBOL]: true,
    config: cfg,
    async publish<TValue = unknown>(
      subject: string,
      data: TValue,
      options?: NatsPublishOptions,
    ): Promise<PublishResult> {
      const timestamp = Date.now();
      const offset = messages.length;
      const msg: StreamingMessage<TValue> = {
        topic: subject,
        partition: 0,
        offset,
        timestamp,
        key: null,
        value: data,
        headers: options?.headers ?? {},
      };
      messages.push(msg as unknown as StreamingMessage);
      await fanout(msg);
      return { topic: subject, partition: 0, offset, timestamp };
    },
    subscribe<TValue = unknown>(subject: string, handler: MessageHandler<TValue>): NatsSubscription {
      const matcher = compileSubject(subject);
      const sub: CoreSubscription = {
        subject,
        matcher,
        handler: handler as MessageHandler,
        active: true,
      };
      subscriptions.push(sub);
      return {
        subject,
        unsubscribe() {
          sub.active = false;
        },
        isClosed() {
          return !sub.active;
        },
      };
    },
    async request<TIn = unknown, TOut = unknown>(
      subject: string,
      data: TIn,
    ): Promise<StreamingMessage<TOut>> {
      requestCounter += 1;
      const replyInbox = `_INBOX.${requestCounter}`;
      const replies: StreamingMessage[] = [];
      const listener: CoreSubscription = {
        subject: replyInbox,
        matcher: compileSubject(replyInbox),
        handler: (m) => {
          replies.push(m);
        },
        active: true,
      };
      subscriptions.push(listener);
      const timestamp = Date.now();
      const offset = messages.length;
      const request: StreamingMessage<TIn> = {
        topic: subject,
        partition: 0,
        offset,
        timestamp,
        key: null,
        value: data,
        headers: { 'reply-to': replyInbox },
      };
      messages.push(request as unknown as StreamingMessage);
      await fanout(request);
      listener.active = false;
      const reply = replies[0];
      if (!reply) {
        throw new Error(`nats mock: request to "${subject}" received no reply`);
      }
      return reply as StreamingMessage<TOut>;
    },
    jetstream(): JetStreamStore {
      return jetstream;
    },
    kv(bucket: string): KVStore {
      if (!kvBuckets.has(bucket)) {
        kvBuckets.set(bucket, new Map());
        kvRevisions.set(bucket, 0);
      }
      const entries = kvBuckets.get(bucket);
      if (!entries) throw new Error(`nats mock: kv bucket "${bucket}" not found`);
      const store: KVStore = {
        [NATS_KV_SYMBOL]: true,
        bucket,
        async put<TValue = unknown>(key: string, value: TValue): Promise<number> {
          const revision = (kvRevisions.get(bucket) ?? 0) + 1;
          kvRevisions.set(bucket, revision);
          const entry: KVEntry<TValue> = {
            bucket,
            key,
            value,
            revision,
            timestamp: Date.now(),
          };
          entries.set(key, entry as unknown as KVEntry);
          return revision;
        },
        async get<TValue = unknown>(key: string): Promise<KVEntry<TValue> | null> {
          const entry = entries.get(key);
          return (entry as KVEntry<TValue>) ?? null;
        },
        async delete(key: string): Promise<void> {
          entries.delete(key);
        },
        async keys(): Promise<string[]> {
          return [...entries.keys()];
        },
        async *watch(): AsyncIterable<KVEntry> {
          for (const entry of entries.values()) yield entry;
        },
      };
      return store;
    },
    objectStore(bucket: string): ObjectStore {
      if (!objectBuckets.has(bucket)) {
        objectBuckets.set(bucket, new Map());
      }
      const objects = objectBuckets.get(bucket);
      if (!objects) throw new Error(`nats mock: object bucket "${bucket}" not found`);
      const store: ObjectStore = {
        [NATS_OBJECT_SYMBOL]: true,
        bucket,
        async put(name: string, data: Uint8Array | string): Promise<ObjectInfo> {
          const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
          const info: ObjectInfo = {
            bucket,
            name,
            size: bytes.byteLength,
            digest: simpleDigest(bytes),
            timestamp: Date.now(),
          };
          objects.set(name, { info, data: bytes });
          return info;
        },
        async get(name: string): Promise<ObjectEntry | null> {
          return objects.get(name) ?? null;
        },
        async delete(name: string): Promise<void> {
          objects.delete(name);
        },
        async list(): Promise<ObjectInfo[]> {
          return [...objects.values()].map((e) => e.info);
        },
      };
      return store;
    },
    async drain(): Promise<void> {
      for (const sub of subscriptions) sub.active = false;
    },
    reset(): void {
      subscriptions.length = 0;
      messages.length = 0;
      jetstreamStreams.clear();
      kvBuckets.clear();
      kvRevisions.clear();
      objectBuckets.clear();
    },
    getSubjectMessages(subject: string): readonly StreamingMessage[] {
      const matcher = compileSubject(subject);
      return messages.filter((m) => matchSubject(matcher, m.topic));
    },
  };
  return mock;
}

function findStreamForSubject(
  streams: Map<string, JetStreamState>,
  subject: string,
): JetStreamState | undefined {
  for (const stream of streams.values()) {
    for (const pattern of stream.config.subjects) {
      if (matchSubject(compileSubject(pattern), subject)) return stream;
    }
  }
  return undefined;
}

function simpleDigest(bytes: Uint8Array): string {
  // Non-cryptographic content digest for object equality checks; matches the
  // mock's intent (assert changes) without pulling in SubtleCrypto async APIs.
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    if (byte === undefined) continue;
    h ^= byte;
    h = Math.imul(h, 0x01000193);
  }
  return `sha256:${(h >>> 0).toString(16).padStart(8, '0')}`;
}

/** Type guard: recognize a NatsMock. */
export function isNatsMock(value: unknown): value is NatsMock {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [NATS_MOCK_SYMBOL]?: true })[NATS_MOCK_SYMBOL] === true
  );
}
