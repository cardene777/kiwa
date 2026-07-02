/**
 * Seed corpus for the RAG dogfood — 5 canonical docs describing kiwa the way
 * `README.md`, `FAQ`, `troubleshooting` and 2 concept pages would in a real
 * knowledge base. Kept inline (no filesystem loader) so real vs mock ingest
 * exercise the same text without file-system dependency skew.
 *
 * The docs are intentionally short — each is ~4 sentences so the harness can
 * verify chunking + retrieval + citation rather than testing a large corpus.
 */

export interface SeedDoc {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export const SEED_DOCS: SeedDoc[] = [
  {
    id: 'doc-kiwa-overview',
    title: 'kiwa overview',
    content:
      'kiwa is a zero-CI test harness for building release-quality SaaS. ' +
      'It ships as a pnpm workspace with @kiwa-test/* packages covering dApp e2e, RabbitMQ workers, Supabase auth, AI-LLM SDK mocks, and quality-metrics release gate. ' +
      'The release gate combines 11 axes (coverage, fidelity, perf, mutation, testCount, cost, latency, token, accuracy) into a single pass / fail verdict. ' +
      'kiwa is designed to run locally without CI providers so every merge is gated by the same rules that ship the release.',
    tags: ['overview', 'release-gate', 'kiwa'],
  },
  {
    id: 'doc-release-gate',
    title: 'release gate axes',
    content:
      'The release gate evaluates 7 base axes for every provider (coverage.line, coverage.branch, coverage.function, fidelity.ratio, perf.p95Ms, mutation.killRate, testCount.behavior) and adds 4 AI-LLM specific axes (cost.perRequestUsd, latency.p95Ms, token.totalTokens, accuracy.score) when the provider string starts with @kiwa-test/ai-llm. ' +
      'Default thresholds are cost ≤ $0.10 per request, p95 latency ≤ 3000 ms, ≤ 4000 tokens per request, and accuracy ≥ 0.80. ' +
      'Providers can override thresholds in packages/quality-metrics/src/gate.ts. ' +
      'The 11-axis branch is what makes the release gate SSOT for AI-LLM.',
    tags: ['release-gate', 'quality-metrics', 'ai-llm', 'thresholds'],
  },
  {
    id: 'doc-ai-llm-harness',
    title: '@kiwa-test/ai-llm harness',
    content:
      '@kiwa-test/ai-llm ships four SDK-shape mocks — createAnthropicMock, createOpenAIMock, createVercelAiMock, and createLangchainMock — that emit the same response shape as the real SDKs so dogfood apps can swap them under KIWA_MODE. ' +
      'The mocks share a MockEngine that resolves prompts through a response bank and emits usage / cost / latency samples. ' +
      'A shared runFidelityCheck helper computes cost / latency / token / accuracy deltas between real and mock. ' +
      'This harness is the source of truth for whether kiwa mocks track real provider behaviour closely enough to trust in downstream unit tests.',
    tags: ['ai-llm', 'harness', 'mock', 'fidelity'],
  },
  {
    id: 'doc-rag-troubleshooting',
    title: 'RAG troubleshooting',
    content:
      'When retrieval quality drops, check chunk size first — the default 500-token chunks preserve enough context for most Q&A. ' +
      'Embedding mismatches between ingest time and query time are the most common cause of empty retrieval results; keep the same embedding model on both sides. ' +
      'When answers hallucinate, pass the retrieved documents as an inline context section in the prompt instead of relying on the model to remember them. ' +
      'Vector-store cursor pagination is not needed for corpora below 10k docs — a flat top-k search is faster and easier to test.',
    tags: ['rag', 'troubleshooting', 'retrieval', 'embedding'],
  },
  {
    id: 'doc-dogfood-apps',
    title: 'dogfood apps',
    content:
      'v1.12 ships three dogfood apps that measure kiwa mock fidelity against real providers — dogfood-anthropic-chatbot for streaming + tool_use, dogfood-openai-tool-agent for function calling + parallel tool calls, and dogfood-vercel-ai-rag for the retrieval + embedding + streaming RAG pipeline. ' +
      'Each dogfood emits a fidelity-latest.json + fidelity-latest.md snapshot into its own quality-report/ directory. ' +
      'The dogfood apps use the same @kiwa-test/quality-metrics 11-axis release gate so their pass / fail verdicts are directly comparable. ' +
      'Together they cover the AI-LLM branch end-to-end — streaming, tool-use, and RAG.',
    tags: ['dogfood', 'v1.12', 'fidelity', 'ai-llm'],
  },
];

