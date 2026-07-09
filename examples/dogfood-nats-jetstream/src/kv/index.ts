/**
 * KV Store flow — put / get / watch / delete + revision-based versioning.
 *
 * The NATS KV Store is a layer on top of JetStream that persists the
 * *latest* value per key. Each mutation bumps the bucket-wide revision,
 * which the flow surfaces as an `updated`/`created` classification so
 * tests can assert against optimistic concurrency semantics without
 * modelling the CAS wire protocol.
 */

import type { KVEntry, KVStore, NatsMock } from '@kiwa-lab/streaming';

export interface KVRun {
  readonly bucket: string;
  readonly put: <T>(key: string, value: T) => Promise<KVPutResult>;
  readonly get: <T = unknown>(key: string) => Promise<KVEntry<T> | null>;
  readonly delete: (key: string) => Promise<void>;
  readonly keys: () => Promise<string[]>;
  readonly watch: () => AsyncIterable<KVEntry>;
  readonly lastRevision: () => number;
  readonly deletesCount: () => number;
}

export interface KVPutResult {
  readonly key: string;
  readonly revision: number;
  readonly kind: 'created' | 'updated';
}

/** Build the KV run bound to a NATS mock bucket. Bucket auto-provisions. */
export function createKVRun(input: {
  readonly nats: NatsMock;
  readonly bucket: string;
}): KVRun {
  const store: KVStore = input.nats.kv(input.bucket);
  let latestRevision = 0;
  const knownKeys = new Set<string>();
  let deletes = 0;

  return {
    bucket: input.bucket,
    async put<T>(key: string, value: T): Promise<KVPutResult> {
      const preexisting = knownKeys.has(key);
      const revision = await store.put<T>(key, value);
      knownKeys.add(key);
      latestRevision = revision;
      return {
        key,
        revision,
        kind: preexisting ? 'updated' : 'created',
      };
    },
    get: <T = unknown>(key: string) => store.get<T>(key),
    async delete(key: string): Promise<void> {
      await store.delete(key);
      knownKeys.delete(key);
      deletes += 1;
    },
    keys: () => store.keys(),
    watch: () => store.watch(),
    lastRevision: () => latestRevision,
    deletesCount: () => deletes,
  };
}
