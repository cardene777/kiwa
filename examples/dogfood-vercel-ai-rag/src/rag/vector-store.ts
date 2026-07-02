/**
 * Vector store interface + in-memory implementation + Pinecone-shape HTTP
 * client. The interface is deliberately small — upsert / query / count /
 * reset — so both implementations satisfy the same contract and the RAG
 * pipeline can swap between them transparently.
 *
 * The in-memory store performs a flat top-k cosine search which is O(n·d)
 * but at 5 seed docs × ~2 chunks × 128 dims that is well below a millisecond
 * and keeps mock retrieval deterministic + trivially inspectable.
 */

import { cosineSimilarity } from './embedder.js';

export interface VectorRecord {
  id: string;
  vector: number[];
  metadata: {
    docId: string;
    chunkIndex: number;
    text: string;
  };
}

export interface QueryHit {
  id: string;
  score: number;
  metadata: VectorRecord['metadata'];
}

export interface VectorStore {
  readonly kind: 'mock-in-memory' | 'pinecone';
  upsert(records: VectorRecord[]): Promise<void>;
  query(vector: number[], topK: number): Promise<QueryHit[]>;
  count(): Promise<number>;
  reset(): Promise<void>;
}

/** In-memory vector store — deterministic, top-k by cosine similarity. */
export function createInMemoryVectorStore(): VectorStore {
  const store = new Map<string, VectorRecord>();
  return {
    kind: 'mock-in-memory',
    async upsert(records) {
      for (const r of records) store.set(r.id, r);
    },
    async query(vector, topK) {
      const hits: QueryHit[] = [];
      for (const rec of store.values()) {
        hits.push({
          id: rec.id,
          score: cosineSimilarity(vector, rec.vector),
          metadata: rec.metadata,
        });
      }
      hits.sort((a, b) => b.score - a.score);
      return hits.slice(0, topK);
    },
    async count() {
      return store.size;
    },
    async reset() {
      store.clear();
    },
  };
}

/**
 * Pinecone-shape HTTP vector store. Sends upsert + query against the
 * Pinecone REST surface; the response shape is well-defined enough that the
 * dogfood app can call it via `fetch` without pulling the Pinecone SDK.
 *
 * The client keeps rolling usage counters for the fidelity harness — total
 * upserted records + last-query latency — so real-mode measurements feed
 * the release gate on the same footing as the mock path.
 */
export interface PineconeEnv {
  url: string;
  apiKey: string;
  indexName: string;
}

export function createPineconeVectorStore(
  env: PineconeEnv,
): VectorStore & { lastQueryLatencyMs: () => number } {
  let lastLatency = 0;
  return {
    kind: 'pinecone',
    async upsert(records) {
      const res = await fetch(`${env.url}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': env.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          namespace: env.indexName,
          vectors: records.map((r) => ({
            id: r.id,
            values: r.vector,
            metadata: {
              docId: r.metadata.docId,
              chunkIndex: r.metadata.chunkIndex,
              text: r.metadata.text,
            },
          })),
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Pinecone upsert failed ${res.status}: ${errText}`);
      }
    },
    async query(vector, topK) {
      const start = performance.now();
      const res = await fetch(`${env.url}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': env.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          namespace: env.indexName,
          vector,
          topK,
          includeMetadata: true,
        }),
      });
      lastLatency = performance.now() - start;
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Pinecone query failed ${res.status}: ${errText}`);
      }
      const body = (await res.json()) as {
        matches: Array<{
          id: string;
          score: number;
          metadata: { docId: string; chunkIndex: number; text: string };
        }>;
      };
      return body.matches.map((m) => ({
        id: m.id,
        score: m.score,
        metadata: {
          docId: m.metadata.docId,
          chunkIndex: m.metadata.chunkIndex,
          text: m.metadata.text,
        },
      }));
    },
    async count() {
      const res = await fetch(`${env.url}/describe_index_stats`, {
        method: 'POST',
        headers: {
          'Api-Key': env.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ namespace: env.indexName }),
      });
      if (!res.ok) return 0;
      const body = (await res.json()) as { totalVectorCount?: number };
      return body.totalVectorCount ?? 0;
    },
    async reset() {
      // Pinecone deletes all vectors in a namespace — kept as a best-effort
      // call the fidelity harness invokes between runs.
      await fetch(`${env.url}/vectors/delete`, {
        method: 'POST',
        headers: {
          'Api-Key': env.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ namespace: env.indexName, deleteAll: true }),
      });
    },
    lastQueryLatencyMs: () => lastLatency,
  };
}
