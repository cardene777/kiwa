/**
 * Retriever — embed the query, run top-k on the vector store, return the
 * hits + a concatenated context string suitable for injection into a LLM
 * prompt. Provider-neutral so both real and mock adapters share this code
 * path.
 */

import type { Embedder } from './embedder.js';
import type { QueryHit, VectorStore } from './vector-store.js';

export interface RetrieverInput {
  query: string;
  topK: number;
}

export interface RetrieverOutput {
  hits: QueryHit[];
  contextBlock: string;
  queryLatencyMs: number;
  queryEmbedding: number[];
}

export async function retrieve(
  embedder: Embedder,
  store: VectorStore,
  input: RetrieverInput,
): Promise<RetrieverOutput> {
  const [queryEmbedding] = await embedder.embed([input.query]);
  if (queryEmbedding === undefined) {
    throw new Error('embedder returned no vectors for the query');
  }
  const start = performance.now();
  const hits = await store.query(queryEmbedding, input.topK);
  const queryLatencyMs = performance.now() - start;
  const contextBlock = hits
    .map((h, i) => `[${i + 1}] (${h.metadata.docId}) ${h.metadata.text}`)
    .join('\n\n');
  return { hits, contextBlock, queryLatencyMs, queryEmbedding };
}

/** Compose the final RAG prompt — system context + user question. */
export function buildRagPrompt(question: string, context: string): string {
  return [
    'Answer the question using only the following context. Cite doc ids inline like (doc-...).',
    '',
    'Context:',
    context,
    '',
    `Question: ${question}`,
    'Answer:',
  ].join('\n');
}
