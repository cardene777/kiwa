import type { RagAdapter, RagResult, StreamedRagResult } from '../adapters/interface.js';

/**
 * User-facing RAG flows the dogfood app exposes. Each flow talks only
 * through {@link RagAdapter} so the same code powers both `KIWA_MODE=real`
 * (real Vercel AI SDK-shape HTTP + real OpenAI embeddings + Pinecone) and
 * `KIWA_MODE=mock` (`@kiwa-lab/ai-llm` createVercelAiMock +
 * createLangchainMock + in-memory store).
 *
 * The flows mirror AC in Issue #698 —
 *   Task 3.1 (embedding fidelity) → runEmbeddingFlow
 *   Task 3.2 (retrieval fidelity) → runRetrievalFlow
 *   Task 3.3 (RAG answer accuracy) → runAnswerFlow / runStreamingAnswerFlow
 */

/** 20 QA pairs used for the answer accuracy metric (Task 3.3). */
export const RAG_QA_PAIRS: Array<{
  question: string;
  groundTruth: string;
}> = [
  {
    question: 'What is kiwa?',
    groundTruth: 'kiwa is a zero-CI test harness for building release-quality SaaS.',
  },
  {
    question: 'How many axes does the release gate evaluate?',
    groundTruth: '11 axes when the provider starts with @kiwa-lab/ai-llm — 7 base plus 4 AI-LLM specific.',
  },
  {
    question: 'What are the AI-LLM specific release gate axes?',
    groundTruth: 'cost.perRequestUsd, latency.p95Ms, token.totalTokens, accuracy.score.',
  },
  {
    question: 'What is the default cost threshold?',
    groundTruth: 'cost.perRequestUsd threshold is $0.10.',
  },
  {
    question: 'What is the default p95 latency threshold?',
    groundTruth: 'p95 latency threshold is 3000 ms.',
  },
  {
    question: 'What is the default token threshold?',
    groundTruth: 'total tokens threshold is 4000 per request.',
  },
  {
    question: 'What is the default accuracy threshold?',
    groundTruth: 'accuracy threshold is 0.80.',
  },
  {
    question: 'Which SDK mocks does @kiwa-lab/ai-llm provide?',
    groundTruth: 'createAnthropicMock, createOpenAIMock, createVercelAiMock, createLangchainMock.',
  },
  {
    question: 'What does createVercelAiMock produce?',
    groundTruth: 'A Vercel AI SDK-shape mock supporting generateText and streamText.',
  },
  {
    question: 'What does createLangchainMock produce?',
    groundTruth: 'A LangChain BaseChatModel-shape mock supporting invoke, stream, and batch.',
  },
  {
    question: 'What is the recommended chunk size for RAG?',
    groundTruth: 'The default 500-token chunks preserve enough context for most Q&A.',
  },
  {
    question: 'Why do retrieval results come back empty?',
    groundTruth: 'Embedding mismatches between ingest time and query time are the most common cause.',
  },
  {
    question: 'How should retrieved documents be passed to the LLM?',
    groundTruth: 'Pass the retrieved documents as an inline context section in the prompt.',
  },
  {
    question: 'When is cursor pagination needed for vector search?',
    groundTruth: 'Not needed for corpora below 10k docs — a flat top-k search is faster and easier to test.',
  },
  {
    question: 'Which dogfood app measures streaming and tool_use?',
    groundTruth: 'dogfood-anthropic-chatbot exercises streaming and tool_use.',
  },
  {
    question: 'Which dogfood app measures function calling and parallel tool calls?',
    groundTruth: 'dogfood-openai-tool-agent exercises function calling and parallel tool calls.',
  },
  {
    question: 'Which dogfood app measures RAG?',
    groundTruth: 'dogfood-vercel-ai-rag exercises the retrieval and embedding and streaming RAG pipeline.',
  },
  {
    question: 'Where does each dogfood emit its fidelity report?',
    groundTruth: 'Each dogfood emits a fidelity-latest.json and fidelity-latest.md snapshot into its own quality-report directory.',
  },
  {
    question: 'Where does the release gate SSOT live?',
    groundTruth: 'packages/quality-metrics/src/gate.ts holds the default thresholds and provider overrides.',
  },
  {
    question: 'Why is kiwa designed to run without CI providers?',
    groundTruth: 'To gate every merge with the same rules that ship the release, locally.',
  },
];

export async function runEmbeddingFlow(
  adapter: RagAdapter,
): Promise<Array<{ query: string; vector: number[]; dimension: number }>> {
  const queries = [
    'What is kiwa?',
    'What are the AI-LLM release gate axes?',
    'How does the mock adapter work?',
  ];
  const out: Array<{ query: string; vector: number[]; dimension: number }> = [];
  for (const query of queries) {
    const res = await adapter.embed(query);
    out.push({ query, vector: res.vector, dimension: res.dimension });
  }
  return out;
}

export async function runRetrievalFlow(adapter: RagAdapter): Promise<
  Array<{
    query: string;
    hitDocIds: string[];
  }>
> {
  await adapter.ingest();
  const queries = [
    { query: 'What is kiwa the harness?', topK: 5 },
    { query: 'AI-LLM release gate axes', topK: 5 },
    { query: 'How to fix retrieval when results are empty', topK: 5 },
  ];
  const out: Array<{ query: string; hitDocIds: string[] }> = [];
  for (const q of queries) {
    const res = await adapter.retrieve(q);
    out.push({
      query: q.query,
      hitDocIds: res.hits.map((h) => h.metadata.docId),
    });
  }
  return out;
}

export async function runAnswerFlow(
  adapter: RagAdapter,
  question: string,
  topK = 5,
): Promise<RagResult> {
  await adapter.ingest();
  return adapter.answer({ question, topK });
}

export async function runStreamingAnswerFlow(
  adapter: RagAdapter,
  question: string,
  topK = 5,
): Promise<StreamedRagResult> {
  await adapter.ingest();
  return adapter.answerStream({ question, topK });
}
