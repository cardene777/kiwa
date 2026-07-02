import type {
  RagAdapter,
  RagResult,
  StreamedRagResult,
  TraceEvent,
} from './interface.js';
import {
  createHashingEmbedder,
  createRealOpenAIEmbedder,
  type Embedder,
} from '../rag/embedder.js';
import {
  createInMemoryVectorStore,
  createPineconeVectorStore,
  type VectorStore,
} from '../rag/vector-store.js';
import { ingestSeedDocs } from '../rag/ingest.js';
import { buildRagPrompt, retrieve } from '../rag/retriever.js';

/**
 * "Real" adapter — wires the Vercel AI SDK-shape HTTP endpoint + real
 * OpenAI embeddings + Pinecone vector store when the full env is set. When
 * any required env is absent (OPENAI_API_KEY / RAG_VECTOR_STORE_URL /
 * RAG_VECTOR_STORE_API_KEY) the adapter switches to a "skipped" variant
 * that records `RAG_ENV_MISSING` on every op so the fidelity harness sees a
 * measured divergence rather than a hard test failure.
 */

export interface RealAdapterEnv {
  openaiApiKey: string;
  openaiChatModel: string;
  openaiEmbeddingModel: string;
  openaiBaseUrl: string;
  vectorStoreUrl: string;
  vectorStoreApiKey: string;
  vectorStoreIndex: string;
}

const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';
const DEFAULT_EMBED_MODEL = 'text-embedding-3-small';
const DEFAULT_BASE_URL = 'https://api.openai.com';
const DEFAULT_INDEX = 'kiwa-dogfood';

/** gpt-4o-mini price table (US$ / 1k tokens) — refreshed 2026-07. */
const PRICE_PER_1K = {
  prompt: 0.00015,
  completion: 0.0006,
};

export function detectRealEnv(): RealAdapterEnv | null {
  const openaiApiKey = process.env['OPENAI_API_KEY'];
  const vectorStoreUrl = process.env['RAG_VECTOR_STORE_URL'];
  const vectorStoreApiKey = process.env['RAG_VECTOR_STORE_API_KEY'];
  if (!openaiApiKey || !vectorStoreUrl || !vectorStoreApiKey) return null;
  return {
    openaiApiKey,
    openaiChatModel: process.env['OPENAI_CHAT_MODEL'] ?? DEFAULT_CHAT_MODEL,
    openaiEmbeddingModel: process.env['OPENAI_EMBEDDING_MODEL'] ?? DEFAULT_EMBED_MODEL,
    openaiBaseUrl: process.env['OPENAI_BASE_URL'] ?? DEFAULT_BASE_URL,
    vectorStoreUrl,
    vectorStoreApiKey,
    vectorStoreIndex: process.env['RAG_VECTOR_STORE_INDEX'] ?? DEFAULT_INDEX,
  };
}

/** Distinguished error emitted when the real adapter runs without full env. */
export class SkippedError extends Error {
  readonly code = 'RAG_ENV_MISSING';
  constructor(op: string) {
    // The message includes the machine-readable code so downstream tests can
    // grep for RAG_ENV_MISSING without needing to unwrap the error class.
    super(
      `SkippedError [RAG_ENV_MISSING]: cannot execute ${op} because OPENAI_API_KEY / RAG_VECTOR_STORE_URL / RAG_VECTOR_STORE_API_KEY are not all set`,
    );
  }
}

export function makeRealAdapter(): RagAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): RagAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'RAG_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    ingest: async () => unsupported('ingest'),
    embed: async () => unsupported('embed'),
    retrieve: async () => unsupported('retrieve'),
    answer: async () => unsupported('answer'),
    answerStream: async () => unsupported('answerStream'),
    metrics: () => ({
      totalCostUsd: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      latencySamplesMs: [],
      requests: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

interface OpenAiCompletionResponse {
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
    };
    finish_reason: 'stop' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): RagAdapter {
  const trace: TraceEvent[] = [];
  const latencies: number[] = [];
  let totalCostUsd = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let requests = 0;

  const embedder: Embedder = createRealOpenAIEmbedder({
    apiKey: env.openaiApiKey,
    model: env.openaiEmbeddingModel,
    baseUrl: env.openaiBaseUrl,
  });
  const store: VectorStore = createPineconeVectorStore({
    url: env.vectorStoreUrl,
    apiKey: env.vectorStoreApiKey,
    indexName: env.vectorStoreIndex,
  });

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function chatComplete(
    prompt: string,
    systemPrompt: string,
    maxTokens: number,
  ): Promise<{ response: OpenAiCompletionResponse; latencyMs: number; costUsd: number }> {
    const start = performance.now();
    const res = await fetch(`${env.openaiBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.openaiChatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
      }),
    });
    const latencyMs = performance.now() - start;
    latencies.push(latencyMs);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI chat/completions failed ${res.status}: ${errText}`);
    }
    const response = (await res.json()) as OpenAiCompletionResponse;
    const costUsd =
      (response.usage.prompt_tokens * PRICE_PER_1K.prompt +
        response.usage.completion_tokens * PRICE_PER_1K.completion) /
      1000;
    totalCostUsd += costUsd;
    totalPromptTokens += response.usage.prompt_tokens;
    totalCompletionTokens += response.usage.completion_tokens;
    requests += 1;
    return { response, latencyMs, costUsd };
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async ingest() {
      const report = await ingestSeedDocs(embedder, store);
      record('ingest', true, {
        detail: {
          docs: report.docsIngested,
          chunks: report.chunksProduced,
          vectors: report.vectorsUpserted,
        },
      });
      return report;
    },

    async embed(text) {
      const start = performance.now();
      const [vector] = await embedder.embed([text]);
      const latencyMs = performance.now() - start;
      const out = {
        vector: vector ?? new Array<number>(embedder.dimension).fill(0),
        dimension: embedder.dimension,
        latencyMs,
      };
      record('embed', true, { detail: { dimension: out.dimension } });
      return out;
    },

    async retrieve(input) {
      try {
        const result = await retrieve(embedder, store, {
          query: input.query,
          topK: input.topK,
        });
        record('retrieve', true, {
          detail: {
            topK: input.topK,
            hitDocIds: result.hits.map((h) => h.metadata.docId),
            hitCount: result.hits.length,
          },
        });
        return { hits: result.hits, queryLatencyMs: result.queryLatencyMs };
      } catch (err) {
        record('retrieve', false, {
          errorKind: 'HTTP_ERROR',
          detail: { message: (err as Error).message },
        });
        throw err;
      }
    },

    async answer(input) {
      const r = await retrieve(embedder, store, { query: input.question, topK: input.topK });
      const prompt = buildRagPrompt(input.question, r.contextBlock);
      const called = await chatComplete(
        prompt,
        'You are a kiwa docs Q&A assistant. Cite retrieved doc ids inline.',
        512,
      );
      const choice = called.response.choices[0];
      if (!choice) {
        record('answer', false, { errorKind: 'EMPTY_CHOICES' });
        throw new Error('OpenAI answer returned no choices');
      }
      const finishReason: RagResult['finishReason'] =
        choice.finish_reason === 'length'
          ? 'length'
          : choice.finish_reason === 'content_filter'
            ? 'content_filter'
            : 'stop';
      const out: RagResult = {
        question: input.question,
        answer: choice.message.content ?? '',
        hits: r.hits,
        queryEmbedding: r.queryEmbedding,
        usage: {
          promptTokens: called.response.usage.prompt_tokens,
          completionTokens: called.response.usage.completion_tokens,
          totalTokens: called.response.usage.total_tokens,
        },
        costUsd: called.costUsd,
        latencyMs: called.latencyMs + r.queryLatencyMs,
        finishReason,
      };
      record('answer', true, {
        detail: {
          topK: input.topK,
          hitDocIds: r.hits.map((h) => h.metadata.docId),
          finishReason: out.finishReason,
        },
      });
      return out;
    },

    async answerStream(input) {
      // Real Vercel AI SDK streaming would consume SSE deltas; the dogfood
      // approximates streaming by chunking the non-streaming response text.
      // The trace captures that the chunking happened so the fidelity harness
      // can measure that the streaming op ran end-to-end.
      const nonStream = await this.answer(input);
      const chunks = chunkString(nonStream.answer, 32);
      const out: StreamedRagResult = {
        question: nonStream.question,
        chunks,
        answer: nonStream.answer,
        hits: nonStream.hits,
        usage: nonStream.usage,
        costUsd: nonStream.costUsd,
        latencyMs: nonStream.latencyMs,
      };
      record('answerStream', true, {
        detail: {
          topK: input.topK,
          chunkCount: chunks.length,
          hitDocIds: nonStream.hits.map((h) => h.metadata.docId),
        },
      });
      return out;
    },

    metrics: () => ({
      totalCostUsd,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      latencySamplesMs: [...latencies],
      requests,
    }),

    async reset() {
      trace.length = 0;
      latencies.length = 0;
      totalCostUsd = 0;
      totalPromptTokens = 0;
      totalCompletionTokens = 0;
      requests = 0;
      await store.reset();
    },
  };
}

function chunkString(text: string, chunkSize: number): string[] {
  if (text.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    out.push(text.slice(i, i + chunkSize));
  }
  return out;
}

/**
 * Test seam — build a "connected" real adapter with an in-memory store and
 * the deterministic hashing embedder so unit tests can exercise the same
 * code path without hitting a live OpenAI + Pinecone endpoint. The trace
 * signal is identical to the real path — only the transports change.
 */
export function makeTestRealAdapter(): RagAdapter {
  const trace: TraceEvent[] = [];
  const latencies: number[] = [];
  let totalCostUsd = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let requests = 0;
  const embedder = createHashingEmbedder();
  const store = createInMemoryVectorStore();

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function fakeAnswer(prompt: string): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; costUsd: number; latencyMs: number }> {
    const promptTokens = Math.max(1, Math.min(500, Math.round(prompt.length / 4)));
    const completionTokens = 60;
    const totalTokens = promptTokens + completionTokens;
    const costUsd = (promptTokens * PRICE_PER_1K.prompt + completionTokens * PRICE_PER_1K.completion) / 1000;
    const latencyMs = 12;
    latencies.push(latencyMs);
    totalCostUsd += costUsd;
    totalPromptTokens += promptTokens;
    totalCompletionTokens += completionTokens;
    requests += 1;
    return {
      text: 'kiwa release gate covers 11 axes for the AI-LLM branch, including cost, latency, token, and accuracy.',
      usage: { promptTokens, completionTokens, totalTokens },
      costUsd,
      latencyMs,
    };
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async ingest() {
      const report = await ingestSeedDocs(embedder, store);
      record('ingest', true, {
        detail: {
          docs: report.docsIngested,
          chunks: report.chunksProduced,
          vectors: report.vectorsUpserted,
        },
      });
      return report;
    },

    async embed(text) {
      const start = performance.now();
      const [vector] = await embedder.embed([text]);
      const latencyMs = performance.now() - start;
      const out = {
        vector: vector ?? new Array<number>(embedder.dimension).fill(0),
        dimension: embedder.dimension,
        latencyMs,
      };
      record('embed', true, { detail: { dimension: out.dimension } });
      return out;
    },

    async retrieve(input) {
      const result = await retrieve(embedder, store, { query: input.query, topK: input.topK });
      record('retrieve', true, {
        detail: {
          topK: input.topK,
          hitDocIds: result.hits.map((h) => h.metadata.docId),
          hitCount: result.hits.length,
        },
      });
      return { hits: result.hits, queryLatencyMs: result.queryLatencyMs };
    },

    async answer(input) {
      const r = await retrieve(embedder, store, { query: input.question, topK: input.topK });
      const prompt = buildRagPrompt(input.question, r.contextBlock);
      const fake = await fakeAnswer(prompt);
      const out: RagResult = {
        question: input.question,
        answer: fake.text,
        hits: r.hits,
        queryEmbedding: r.queryEmbedding,
        usage: fake.usage,
        costUsd: fake.costUsd,
        latencyMs: fake.latencyMs + r.queryLatencyMs,
        finishReason: 'stop',
      };
      record('answer', true, {
        detail: {
          topK: input.topK,
          hitDocIds: r.hits.map((h) => h.metadata.docId),
          finishReason: out.finishReason,
        },
      });
      return out;
    },

    async answerStream(input) {
      const nonStream = await this.answer(input);
      const chunks = chunkString(nonStream.answer, 32);
      const out: StreamedRagResult = {
        question: nonStream.question,
        chunks,
        answer: nonStream.answer,
        hits: nonStream.hits,
        usage: nonStream.usage,
        costUsd: nonStream.costUsd,
        latencyMs: nonStream.latencyMs,
      };
      record('answerStream', true, {
        detail: {
          topK: input.topK,
          chunkCount: chunks.length,
          hitDocIds: nonStream.hits.map((h) => h.metadata.docId),
        },
      });
      return out;
    },

    metrics: () => ({
      totalCostUsd,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      latencySamplesMs: [...latencies],
      requests,
    }),

    async reset() {
      trace.length = 0;
      latencies.length = 0;
      totalCostUsd = 0;
      totalPromptTokens = 0;
      totalCompletionTokens = 0;
      requests = 0;
      await store.reset();
    },
  };
}
