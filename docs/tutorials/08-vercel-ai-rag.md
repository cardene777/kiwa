# Vercel AI SDK + LangChain RAG pipeline

## What you'll build

A vitest test file that runs a minimal **retrieval-augmented generation** pipeline against `@kiwa-lab/ai-llm`'s `createVercelAiMock` — chunk a small doc, embed each chunk with a deterministic hashing embedder, upsert into an in-memory vector store, retrieve top-k hits for a question, and stream an answer grounded in the retrieved context. The pattern mirrors the dogfood app at `examples/dogfood-vercel-ai-rag/` and covers every axis the fidelity harness measures (embedding cosine similarity, retrieval F1, answer Jaccard).

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory

## Step-by-step build

```bash
mkdir kiwa-vercel-ai-rag && cd kiwa-vercel-ai-rag
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/ai-llm
```

Set `type: module` in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/embedder.ts` — deterministic hashing embedder:

```ts
/**
 * Bag-of-words hashing embedder — token buckets normalised to unit length so
 * cosine similarity behaves like a scaled dot product. Two texts sharing
 * tokens end up with high cosine similarity; disjoint texts near zero.
 * Deterministic, dependency-free, and stable enough to power test retrieval.
 */
export interface Embedder {
  readonly dimension: number;
  embed(texts: string[]): Promise<number[][]>;
}

export function createHashingEmbedder(dimension = 128): Embedder {
  return {
    dimension,
    async embed(texts) {
      return texts.map((t) => embedOne(t, dimension));
    },
  };
}

function embedOne(text: string, dim: number): number[] {
  const vec = new Array<number>(dim).fill(0);
  for (const token of tokenize(text)) {
    const idx = stableHash(token) % dim;
    vec[idx] = (vec[idx] ?? 0) + 1;
  }
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  return norm === 0 ? vec : vec.map((v) => v / norm);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function stableHash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return dot; // already unit-normalised
}
```

Create `src/vector-store.ts` — a tiny in-memory store:

```ts
import { cosineSimilarity } from './embedder.js';

export interface VectorRecord {
  id: string;
  vector: number[];
  metadata: { docId: string; chunkIndex: number; text: string };
}

export interface QueryHit {
  id: string;
  score: number;
  metadata: VectorRecord['metadata'];
}

export function createInMemoryVectorStore() {
  const store = new Map<string, VectorRecord>();
  return {
    async upsert(records: VectorRecord[]) {
      for (const r of records) store.set(r.id, r);
    },
    async query(vector: number[], topK: number): Promise<QueryHit[]> {
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
```

Create `src/rag.ts` — the ingest + retrieve + answer glue:

```ts
import { createVercelAiMock } from '@kiwa-lab/ai-llm';
import { createHashingEmbedder } from './embedder.js';
import { createInMemoryVectorStore, type QueryHit } from './vector-store.js';

/** 3 tiny seed docs. Real apps pull from a corpus + chunker. */
export const SEED_DOCS = [
  {
    id: 'doc-1',
    text: 'kiwa is a zero-CI test harness for building release-quality SaaS with real-vs-mock fidelity.',
  },
  {
    id: 'doc-2',
    text: 'The release gate evaluates 11 axes when the provider starts with @kiwa-lab/ai-llm — 7 base plus 4 AI-LLM specific: cost, latency, token, accuracy.',
  },
  {
    id: 'doc-3',
    text: 'When retrieval returns empty results, embedding mismatches between ingest time and query time are the most common cause.',
  },
] as const;

export async function ingest() {
  const embedder = createHashingEmbedder();
  const store = createInMemoryVectorStore();
  const vectors = await embedder.embed(SEED_DOCS.map((d) => d.text));
  await store.upsert(
    SEED_DOCS.map((doc, i) => ({
      id: `${doc.id}-c0`,
      vector: vectors[i]!,
      metadata: { docId: doc.id, chunkIndex: 0, text: doc.text },
    })),
  );
  return { embedder, store, docCount: await store.count() };
}

/** Build a RAG prompt by injecting the retrieved snippets before the question. */
export function buildRagPrompt(hits: QueryHit[], question: string): string {
  const context = hits
    .map((h, i) => `[${i + 1}] ${h.metadata.text}`)
    .join('\n');
  return `Context:\n${context}\n\nQuestion: ${question}`;
}

/**
 * Full RAG turn — embed question, retrieve top-k, generate an answer via
 * Vercel AI SDK-shape `generateText`. A fresh mock client is created per
 * question so the response bank can be seeded with a canned answer keyed
 * on the constructed prompt.
 */
export async function answer(input: {
  question: string;
  topK: number;
  cannedAnswer: string;
}) {
  const { embedder, store } = await ingest();
  const [qvec] = await embedder.embed([input.question]);
  const hits = await store.query(qvec ?? [], input.topK);
  const prompt = buildRagPrompt(hits, input.question);

  const mock = createVercelAiMock({
    model: 'gpt-4o-mini-mock',
    artificialLatencyMs: 8,
    costPer1kTokens: { prompt: 0.00015, completion: 0.0006 },
    responses: {
      [prompt]: {
        content: input.cannedAnswer,
        usage: { promptTokens: 120, completionTokens: 24 },
      },
    },
  });
  const gen = await mock.generateText({
    messages: [{ role: 'user', content: prompt }],
  });
  return { hits, text: gen.text, costUsd: gen._kiwa.costUsd };
}

export async function answerStream(input: {
  question: string;
  topK: number;
  cannedChunks: string[];
}) {
  const { embedder, store } = await ingest();
  const [qvec] = await embedder.embed([input.question]);
  const hits = await store.query(qvec ?? [], input.topK);
  const prompt = buildRagPrompt(hits, input.question);

  const mock = createVercelAiMock({
    model: 'gpt-4o-mini-mock',
    artificialLatencyMs: 8,
    costPer1kTokens: { prompt: 0.00015, completion: 0.0006 },
    responses: {
      [prompt]: {
        content: input.cannedChunks.join(''),
        chunks: input.cannedChunks,
        usage: { promptTokens: 120, completionTokens: input.cannedChunks.length * 2 },
      },
    },
  });
  const stream = mock.streamText({ messages: [{ role: 'user', content: prompt }] });
  const chunks: string[] = [];
  for await (const delta of stream.textStream) chunks.push(delta);
  return { hits, chunks, full: chunks.join('') };
}
```

Add `tests/rag.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { answer, answerStream, ingest, SEED_DOCS } from '../src/rag.js';

describe('vercel ai rag pipeline — mock', () => {
  it('ingests 3 docs into the in-memory vector store', async () => {
    const { docCount } = await ingest();
    expect(docCount).toBe(SEED_DOCS.length);
  });

  it('retrieves the release-gate doc for a gate-related question', async () => {
    const { hits, text } = await answer({
      question: 'How many axes does the release gate evaluate?',
      topK: 3,
      cannedAnswer:
        '11 axes when the provider starts with @kiwa-lab/ai-llm — 7 base plus 4 AI-LLM specific.',
    });
    expect(hits[0]?.metadata.docId).toBe('doc-2');
    expect(text).toMatch(/11 axes/);
  });

  it('streams a grounded answer via streamText', async () => {
    const { hits, chunks, full } = await answerStream({
      question: 'Why is retrieval returning empty results?',
      topK: 3,
      cannedChunks: [
        'Embedding ',
        'mismatches ',
        'between ',
        'ingest ',
        'and ',
        'query ',
        'time.',
      ],
    });
    expect(hits[0]?.metadata.docId).toBe('doc-3');
    expect(chunks.length).toBeGreaterThan(1);
    expect(full).toMatch(/Embedding/);
  });
});
```

Run:

```bash
pnpm test
```

You should see three passing tests in under a second.

## Explanation

- **Embedder** — the hashing embedder buckets tokens into 128 slots via a stable FNV-1a hash, then L2-normalises so cosine similarity reduces to a dot product. It is deterministic (identical text → identical vector), fast, and preserves the property that similar text produces similar vectors — enough for retrieval ordering to be stable in tests. Real apps swap this for OpenAI's `text-embedding-3-small` (1536 dims) or similar; the interface stays the same.
- **Vector store** — the in-memory store is a flat top-k cosine search. O(n·d) is fine for 3 seed docs × 128 dims; the real dogfood app uses a Pinecone-shape HTTP client at `src/rag/vector-store.ts` when `RAG_VECTOR_STORE_URL` + `RAG_VECTOR_STORE_API_KEY` are set.
- **Per-question mock** — `createVercelAiMock` keys responses on the last `role: 'user'` message content. Since every RAG question builds a new prompt (context block + question), a fresh mock client is constructed per call whose response bank is keyed on the exact constructed prompt. This keeps mock answers grounded in retrieved context without changes to the shared engine.
- **`generateText` vs `streamText`** — both are provided by `createVercelAiMock`. The streaming path yields deltas from the `chunks: []` array in the response bank, matching Vercel AI SDK's `textStream` iterator shape.

## Real-vs-mock fidelity (optional)

The dogfood app at `examples/dogfood-vercel-ai-rag/` measures three task-specific fidelity metrics beyond the base 4 AI-LLM axes.

- **Embedding cosine similarity (mean)** ≥ 0.95 — real OpenAI embeddings vs mock hashing embeddings, computed over the query set.
- **Retrieval F1 (top-5, mean)** ≥ 0.90 — precision + recall of retrieved `docId` sets vs a hand-labelled ground truth.
- **Answer Jaccard similarity (mean)** ≥ 0.80 — word-level Jaccard of mock answer vs real answer for the 20 QA pairs in [`src/flows/rag-flows.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-vercel-ai-rag/src/flows/rag-flows.ts).

The harness emits `quality-report/fidelity-latest.md` after each `pnpm test` run; when the numbers become canonical for a release, promote the snapshot to `docs/quality-reports/ai-llm/vercel-ai-rag.md`.

Real-mode envs.

- `OPENAI_API_KEY` — required.
- `OPENAI_CHAT_MODEL` — defaults to `gpt-4o-mini`.
- `OPENAI_EMBEDDING_MODEL` — defaults to `text-embedding-3-small`.
- `RAG_VECTOR_STORE_URL` — Pinecone-shape endpoint URL.
- `RAG_VECTOR_STORE_API_KEY` — Pinecone API key.
- `RAG_VECTOR_STORE_INDEX` — namespace (defaults to `kiwa-dogfood`).

Without any of those the real adapter reports `RAG_ENV_MISSING` for every method; the fidelity harness records the gap without failing the suite.

## Troubleshoot

- **Retrieval returns empty results** — Embedding mismatch between ingest and query time. Check that both sides use the same `Embedder` instance (or at least the same `dimension` + hash function). The 128-dim hashing embedder is deterministic, so re-embedding the same text always produces the same vector.
- **`generateText` returns the default fallback content** — Your response bank key does not exactly match the last user message content. The bank keys on `messages[messages.length - 1].content` for `role: 'user'` messages — any drift (trailing space, punctuation, capitalisation) triggers the fallback.
- **`chunks` in `answerStream` is empty** — The response bank entry is missing `chunks: [...]`. `content` alone drives `generateText`; `chunks` drives `streamText`.
- **Chunk indices collide** — Chunking a real doc corpus produces `docId-cN` ids per chunk. Make sure `chunkIndex` is unique within a `docId` — the store keys on `id`, so two chunks with the same id overwrite each other silently.

## Next steps

- The [AI-LLM testing concept guide](../concepts/ai-llm-testing.md) explains why AI-LLM tests need extra fidelity / cost / accuracy axes and how to think about non-determinism.
- The dogfood app's [`src/rag/chunker.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-vercel-ai-rag/src/rag/chunker.ts) shows a real chunker with 500-char chunks + 50-char overlap that approximates LangChain's `RecursiveCharacterTextSplitter`.
- [`@kiwa-lab/quality-metrics`](../quality/release-gate) documents the 11-axis release gate; AI-LLM 4 axes activate when the provider string starts with `@kiwa-lab/ai-`.
