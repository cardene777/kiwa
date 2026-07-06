// NATS KV / Object-Store semantics — bucket lifecycle + revision tracking +
// watch subscription + object chunking + optional LZ4-tagged compression.
// Complements the base KV / Object stores exported from `nats.ts` by adding
// the version-aware operations that show up in production tests.
//
// Real NATS KV rides on JetStream and exposes revisions ("first" / "last" +
// per-key monotonic ints), history windows, and delete tombstones. Object
// store adds chunked writes with per-chunk digest. The model here captures
// those pieces without the storage layer.

export const NATS_KV_OBJECT_SYMBOL = Symbol.for('kiwa.streaming.semantics.nats-kv-object');

export type CompressionKind = 'none' | 'lz4';

export interface KvBucketConfig {
  readonly bucket: string;
  /** History depth — max revisions kept per key. Default 1. */
  readonly historyDepth?: number;
  /** ttl in ms — 0 = keep forever. Default 0. */
  readonly ttlMs?: number;
}

export interface KvRevision<TValue = unknown> {
  readonly bucket: string;
  readonly key: string;
  readonly value: TValue;
  readonly revision: number;
  readonly createdAt: number;
  readonly operation: 'put' | 'delete';
}

export interface KvWatchEvent<TValue = unknown> {
  readonly revision: KvRevision<TValue>;
}

export interface ObjectBucketConfig {
  readonly bucket: string;
  /** Chunk size in bytes for object writes. Default 128 * 1024. */
  readonly chunkSizeBytes?: number;
  readonly compression?: CompressionKind;
}

export interface ObjectChunk {
  readonly index: number;
  readonly bytes: Uint8Array;
  readonly digest: string;
}

export interface ObjectRecord {
  readonly bucket: string;
  readonly name: string;
  readonly size: number;
  readonly chunks: readonly ObjectChunk[];
  readonly compression: CompressionKind;
  readonly writtenAt: number;
}

export interface NatsKvObject {
  readonly [NATS_KV_OBJECT_SYMBOL]: true;

  createKvBucket(config: KvBucketConfig): void;
  putKv<TValue = unknown>(bucket: string, key: string, value: TValue): KvRevision<TValue>;
  getKv<TValue = unknown>(bucket: string, key: string): KvRevision<TValue> | null;
  historyKv<TValue = unknown>(bucket: string, key: string): readonly KvRevision<TValue>[];
  deleteKv(bucket: string, key: string): KvRevision<null>;
  watchKv(bucket: string): AsyncIterable<KvWatchEvent>;
  emitWatchEvents(bucket: string, now: number): void;

  createObjectBucket(config: ObjectBucketConfig): void;
  putObject(bucket: string, name: string, bytes: Uint8Array): ObjectRecord;
  getObject(bucket: string, name: string): ObjectRecord | null;
  reassembleObject(bucket: string, name: string): Uint8Array | null;

  reset(): void;
}

interface KvBucketState {
  readonly config: Required<KvBucketConfig>;
  readonly latestByKey: Map<string, KvRevision<unknown>>;
  readonly history: KvRevision<unknown>[];
  readonly watchers: {
    resolve: (event: IteratorResult<KvWatchEvent>) => void;
    lastEmittedIndex: number;
  }[];
}

interface ObjectBucketState {
  readonly config: Required<ObjectBucketConfig>;
  readonly objects: Map<string, ObjectRecord>;
}

function computeDigest(bytes: Uint8Array): string {
  // Simple 32-bit FNV-1a digest — plenty for test-side content addressing.
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i] ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(8, '0');
}

function tagCompression(bytes: Uint8Array, kind: CompressionKind): Uint8Array {
  if (kind === 'none') return bytes;
  // Real LZ4 would compress; the mock prefixes a marker so tests can assert
  // compression was applied without dragging in a codec dependency.
  const prefix = new TextEncoder().encode('LZ4:');
  const combined = new Uint8Array(prefix.length + bytes.length);
  combined.set(prefix, 0);
  combined.set(bytes, prefix.length);
  return combined;
}

function stripCompression(bytes: Uint8Array, kind: CompressionKind): Uint8Array {
  if (kind === 'none') return bytes;
  const prefixLen = 'LZ4:'.length;
  if (bytes.length < prefixLen) return bytes;
  const marker = new TextDecoder().decode(bytes.slice(0, prefixLen));
  if (marker !== 'LZ4:') return bytes;
  return bytes.slice(prefixLen);
}

/**
 * Create a combined KV + Object-store model. KV supports history depth +
 * delete tombstones; Object splits inputs into chunks with per-chunk digest
 * and an optional LZ4-tagged compression pass so tests can validate the
 * chunk boundary + digest + reassembly.
 */
export function createNatsKvObject(): NatsKvObject {
  const kvBuckets = new Map<string, KvBucketState>();
  const objectBuckets = new Map<string, ObjectBucketState>();

  function ensureKvBucket(bucket: string): KvBucketState {
    const state = kvBuckets.get(bucket);
    if (!state) throw new Error(`nats kv-object: unknown KV bucket "${bucket}"`);
    return state;
  }

  function ensureObjectBucket(bucket: string): ObjectBucketState {
    const state = objectBuckets.get(bucket);
    if (!state) throw new Error(`nats kv-object: unknown object bucket "${bucket}"`);
    return state;
  }

  function trimHistory(state: KvBucketState, key: string): void {
    const depth = state.config.historyDepth;
    const revs = state.history.filter((r) => r.key === key);
    if (revs.length <= depth) return;
    const drop = revs.length - depth;
    for (let i = 0; i < drop; i += 1) {
      const target = revs[i];
      if (!target) continue;
      const idx = state.history.indexOf(target);
      if (idx >= 0) state.history.splice(idx, 1);
    }
  }

  const store: NatsKvObject = {
    [NATS_KV_OBJECT_SYMBOL]: true,
    createKvBucket(config: KvBucketConfig): void {
      if (kvBuckets.has(config.bucket)) return;
      kvBuckets.set(config.bucket, {
        config: {
          bucket: config.bucket,
          historyDepth: config.historyDepth ?? 1,
          ttlMs: config.ttlMs ?? 0,
        },
        latestByKey: new Map(),
        history: [],
        watchers: [],
      });
    },
    putKv<TValue = unknown>(bucket: string, key: string, value: TValue): KvRevision<TValue> {
      const state = ensureKvBucket(bucket);
      const last = state.latestByKey.get(key);
      const revision: KvRevision<TValue> = {
        bucket,
        key,
        value,
        revision: (last?.revision ?? 0) + 1,
        createdAt: Date.now(),
        operation: 'put',
      };
      state.latestByKey.set(key, revision as KvRevision<unknown>);
      state.history.push(revision as KvRevision<unknown>);
      trimHistory(state, key);
      return revision;
    },
    getKv<TValue = unknown>(bucket: string, key: string): KvRevision<TValue> | null {
      const state = ensureKvBucket(bucket);
      const entry = state.latestByKey.get(key);
      if (!entry || entry.operation === 'delete') return null;
      return entry as KvRevision<TValue>;
    },
    historyKv<TValue = unknown>(bucket: string, key: string): readonly KvRevision<TValue>[] {
      const state = ensureKvBucket(bucket);
      return state.history.filter((r) => r.key === key) as KvRevision<TValue>[];
    },
    deleteKv(bucket: string, key: string): KvRevision<null> {
      const state = ensureKvBucket(bucket);
      const last = state.latestByKey.get(key);
      const revision: KvRevision<null> = {
        bucket,
        key,
        value: null,
        revision: (last?.revision ?? 0) + 1,
        createdAt: Date.now(),
        operation: 'delete',
      };
      state.latestByKey.set(key, revision as KvRevision<unknown>);
      state.history.push(revision as KvRevision<unknown>);
      trimHistory(state, key);
      return revision;
    },
    watchKv(bucket: string): AsyncIterable<KvWatchEvent> {
      const state = ensureKvBucket(bucket);
      return {
        [Symbol.asyncIterator]() {
          let lastIndex = 0;
          return {
            async next(): Promise<IteratorResult<KvWatchEvent>> {
              if (lastIndex < state.history.length) {
                const rev = state.history[lastIndex];
                lastIndex += 1;
                if (rev) return { value: { revision: rev }, done: false };
              }
              return { value: undefined, done: true };
            },
          };
        },
      };
    },
    emitWatchEvents(bucket: string): void {
      // No-op in this model — watch is lazy, consumers iterate to pick up
      // events. Kept for API symmetry with the JetStream stream sweep.
      ensureKvBucket(bucket);
    },
    createObjectBucket(config: ObjectBucketConfig): void {
      if (objectBuckets.has(config.bucket)) return;
      objectBuckets.set(config.bucket, {
        config: {
          bucket: config.bucket,
          chunkSizeBytes: config.chunkSizeBytes ?? 128 * 1024,
          compression: config.compression ?? 'none',
        },
        objects: new Map(),
      });
    },
    putObject(bucket: string, name: string, bytes: Uint8Array): ObjectRecord {
      const state = ensureObjectBucket(bucket);
      const compressed = tagCompression(bytes, state.config.compression);
      const chunkSize = state.config.chunkSizeBytes;
      const chunks: ObjectChunk[] = [];
      for (let i = 0, index = 0; i < compressed.length; i += chunkSize, index += 1) {
        const slice = compressed.slice(i, Math.min(i + chunkSize, compressed.length));
        chunks.push({ index, bytes: slice, digest: computeDigest(slice) });
      }
      const record: ObjectRecord = {
        bucket,
        name,
        size: bytes.length,
        chunks,
        compression: state.config.compression,
        writtenAt: Date.now(),
      };
      state.objects.set(name, record);
      return record;
    },
    getObject(bucket: string, name: string): ObjectRecord | null {
      const state = ensureObjectBucket(bucket);
      return state.objects.get(name) ?? null;
    },
    reassembleObject(bucket: string, name: string): Uint8Array | null {
      const state = ensureObjectBucket(bucket);
      const record = state.objects.get(name);
      if (!record) return null;
      let total = 0;
      for (const c of record.chunks) total += c.bytes.length;
      const combined = new Uint8Array(total);
      let offset = 0;
      for (const c of record.chunks) {
        combined.set(c.bytes, offset);
        offset += c.bytes.length;
      }
      return stripCompression(combined, record.compression);
    },
    reset(): void {
      kvBuckets.clear();
      objectBuckets.clear();
    },
  };
  return store;
}

/** Type guard: recognize a NatsKvObject. */
export function isNatsKvObject(value: unknown): value is NatsKvObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [NATS_KV_OBJECT_SYMBOL]?: true })[NATS_KV_OBJECT_SYMBOL] === true
  );
}
