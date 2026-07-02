/**
 * Document ingest pipeline — chunk the docs, embed the chunks, upsert them
 * into the vector store. Called once at the start of a RAG run so retrieval
 * and generation have data to work with.
 */

import { chunkText, type Chunk } from './chunker.js';
import type { Embedder } from './embedder.js';
import type { VectorRecord, VectorStore } from './vector-store.js';
import { SEED_DOCS, type SeedDoc } from '../data/seed-docs.js';

export interface IngestReport {
  docsIngested: number;
  chunksProduced: number;
  vectorsUpserted: number;
  embedderDimension: number;
  storeKind: VectorStore['kind'];
}

/** Chunk + embed + upsert the seed docs into the vector store. */
export async function ingestSeedDocs(
  embedder: Embedder,
  store: VectorStore,
  docs: SeedDoc[] = SEED_DOCS,
): Promise<IngestReport> {
  await store.reset();
  const chunks: Chunk[] = [];
  for (const d of docs) {
    for (const c of chunkText(d.id, d.content)) chunks.push(c);
  }
  const vectors = await embedder.embed(chunks.map((c) => c.text));
  const records: VectorRecord[] = chunks.map((c, i) => ({
    id: `${c.docId}#${c.chunkIndex}`,
    vector: vectors[i] ?? new Array<number>(embedder.dimension).fill(0),
    metadata: {
      docId: c.docId,
      chunkIndex: c.chunkIndex,
      text: c.text,
    },
  }));
  await store.upsert(records);
  return {
    docsIngested: docs.length,
    chunksProduced: chunks.length,
    vectorsUpserted: records.length,
    embedderDimension: embedder.dimension,
    storeKind: store.kind,
  };
}
