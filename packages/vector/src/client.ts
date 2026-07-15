export type VectorProvider = 'pinecone' | 'weaviate' | 'qdrant' | 'pgvector';

export type VectorMetadata = Record<string, string | number | boolean>;

export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: VectorMetadata;
}

export interface UpsertResult {
  upsertedCount: number;
  provider: VectorProvider;
  namespace: string;
}

export interface CreateVectorClientOptions {
  provider?: VectorProvider;
  namespace?: string;
  dimension?: number;
  failOn?: (record: VectorRecord) => boolean;
}

export interface VectorClient {
  provider: VectorProvider;
  namespace: string;
  dimension: number | null;
  upsert: (records: VectorRecord[]) => Promise<UpsertResult>;
  fetch: (id: string) => Promise<VectorRecord | null>;
  list: () => VectorRecord[];
  size: () => number;
  clear: () => void;
  /** internal helper for query.ts / delete */
  _delete: (ids: string[]) => number;
  _failOn?: (record: VectorRecord) => boolean;
}

/**
 * provider 別 mock client。 実 Pinecone / Weaviate / Qdrant / pgvector の SDK を差替えても
 * 同じ signature で呼べる想定 (upsert / query / delete)。 mock 内部は Map で保持。
 */
export function createVectorClient(options: CreateVectorClientOptions = {}): VectorClient {
  const provider = options.provider ?? 'pinecone';
  const namespace = options.namespace ?? 'default';
  const dimension = options.dimension ?? null;
  const failOn = options.failOn;
  const store = new Map<string, VectorRecord>();

  const client: VectorClient = {
    provider,
    namespace,
    dimension,
    async upsert(records: VectorRecord[]): Promise<UpsertResult> {
      let upsertedCount = 0;
      for (const rec of records) {
        if (failOn && failOn(rec)) {
          throw new Error(`provider rejected id=${rec.id}`);
        }
        if (dimension !== null && rec.values.length !== dimension) {
          throw new Error(`dimension mismatch: expected ${dimension}, got ${rec.values.length}`);
        }
        store.set(rec.id, rec);
        upsertedCount += 1;
      }
      return { upsertedCount, provider, namespace };
    },
    async fetch(id: string): Promise<VectorRecord | null> {
      return store.get(id) ?? null;
    },
    list(): VectorRecord[] {
      return Array.from(store.values());
    },
    size(): number {
      return store.size;
    },
    clear(): void {
      store.clear();
    },
    _delete(ids: string[]): number {
      let count = 0;
      for (const id of ids) {
        if (store.delete(id)) count += 1;
      }
      return count;
    },
  };
  if (failOn !== undefined) client._failOn = failOn;
  return client;
}
