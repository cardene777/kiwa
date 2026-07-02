/**
 * Provider-neutral RAG adapter surface for the dogfood app.
 *
 * The app talks to Vercel AI SDK + LangChain + a vector store only through
 * this interface. Two implementations exist — {@link makeRealAdapter}
 * (real Vercel AI SDK-shape HTTP calls + real OpenAI embeddings + Pinecone
 * vector store when env is set, otherwise reports `RAG_ENV_MISSING`) and
 * {@link makeMockAdapter} (backed by `@kiwa-test/ai-llm`'s
 * {@link createVercelAiMock} + {@link createLangchainMock} + in-memory
 * vector store). Both must satisfy the same contract so retrieval /
 * embedding / final-answer fidelity between real vs mock can be measured
 * side-by-side and fed to `@kiwa-test/quality-metrics` 11-axis release gate.
 */

import type { IngestReport } from '../rag/ingest.js';
import type { QueryHit } from '../rag/vector-store.js';

/** A completed RAG turn — retrieval + generation, non-streaming. */
export interface RagResult {
  question: string;
  answer: string;
  hits: QueryHit[];
  queryEmbedding: number[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'content_filter';
}

/** A streamed RAG turn — retrieval + streaming generation. */
export interface StreamedRagResult {
  question: string;
  chunks: string[];
  answer: string;
  hits: QueryHit[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences (Task 3.1-3.4 fidelity harness input).
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface RagAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Ingest the seed docs into the vector store. Fresh reset first so
   * repeated runs produce the same state.
   */
  ingest(): Promise<IngestReport>;

  /** Embed a single string (used for embedding-fidelity Task 3.1). */
  embed(text: string): Promise<{
    vector: number[];
    dimension: number;
    latencyMs: number;
  }>;

  /**
   * Retrieve top-k docs for the query (used for retrieval-fidelity
   * Task 3.2). Adapter must have completed `ingest()` first.
   */
  retrieve(input: { query: string; topK: number }): Promise<{
    hits: QueryHit[];
    queryLatencyMs: number;
  }>;

  /**
   * Full RAG turn — embed + retrieve + generate answer (used for
   * answer-fidelity Task 3.3).
   */
  answer(input: { question: string; topK: number }): Promise<RagResult>;

  /**
   * Streaming RAG turn — same as `answer` but the LLM response is streamed.
   * Verifies Vercel AI SDK streaming shape is preserved by the mock.
   */
  answerStream(input: { question: string; topK: number }): Promise<StreamedRagResult>;

  /** Rolling metric aggregate the adapter has seen since construction / reset. */
  metrics(): {
    totalCostUsd: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    latencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}
