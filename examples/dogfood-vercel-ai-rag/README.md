# dogfood-vercel-ai-rag

Dogfood app 3 (v1.12-4) — a **Vercel AI SDK + LangChain retriever + embedding + RAG pipeline** that exercises document ingest, chunking, embedding, vector-store search, retrieval, and streaming LLM generation across a provider-neutral interface so `@kiwa-lab/ai-llm`'s Vercel AI SDK + LangChain mocks can be measured against a real Vercel AI SDK-shape endpoint + real OpenAI embeddings + Pinecone-shape vector store. The resulting fidelity report feeds `@kiwa-lab/quality-metrics` 11-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-lab/ai-llm` `createVercelAiMock` + `createLangchainMock` + deterministic hashing embedder + in-memory vector store).
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that calls `POST /v1/chat/completions` + `POST /v1/embeddings` on OpenAI + Pinecone `/vectors/upsert` + `/query` via `fetch` when all three of `OPENAI_API_KEY` / `RAG_VECTOR_STORE_URL` / `RAG_VECTOR_STORE_API_KEY` are set. Without any of them each method reports `RAG_ENV_MISSING` so the fidelity harness records the gap without failing the suite.

Real-mode envs.

- `OPENAI_API_KEY` — required to enable real mode
- `OPENAI_CHAT_MODEL` — defaults to `gpt-4o-mini`
- `OPENAI_EMBEDDING_MODEL` — defaults to `text-embedding-3-small`
- `OPENAI_BASE_URL` — defaults to `https://api.openai.com`
- `RAG_VECTOR_STORE_URL` — Pinecone-shape endpoint URL (required)
- `RAG_VECTOR_STORE_API_KEY` — Pinecone API key (required)
- `RAG_VECTOR_STORE_INDEX` — namespace / index (defaults to `kiwa-dogfood`)

## Layout

```
src/
  data/
    seed-docs.ts       -- 5 seed docs (kiwa overview / release gate / harness / RAG troubleshooting / dogfood apps)
  rag/
    chunker.ts         -- deterministic text splitter (500 char chunk + 50 char overlap)
    embedder.ts        -- Embedder interface + hashing (mock) + real OpenAI embeddings HTTP client
    vector-store.ts    -- VectorStore interface + in-memory (mock) + Pinecone HTTP client
    ingest.ts          -- chunk + embed + upsert pipeline
    retriever.ts       -- embed query + top-k search + context block builder
  adapters/
    interface.ts       -- provider-neutral RagAdapter contract (ingest / embed / retrieve / answer / answerStream)
    mock.ts            -- kiwa Vercel AI + LangChain mock adapter (per-question response bank)
    real.ts            -- Vercel AI SDK-shape HTTP + Pinecone adapter with graceful skip when env missing
  flows/
    rag-flows.ts       -- 20 QA pair set + embedding / retrieval / answer / streaming flows
    fidelity.ts        -- trace-diffing harness + retrieval F1 + mean cosine helper
tests/
  e2e-mock-mode.test.ts      -- mock-mode end-to-end tests (8)
  embedding-fidelity.test.ts -- Task 3.1 embedding fidelity (4)
  retrieval-fidelity.test.ts -- Task 3.2 retrieval fidelity (5)
  rag-answer.test.ts         -- Task 3.3 answer accuracy (6)
  fidelity-report.test.ts    -- Task 3.4 fidelity harness contract (4)
  emit-fidelity-report.test.ts -- writes the JSON + markdown snapshot (1)
```

## Emit a fidelity report

```bash
pnpm --filter dogfood-vercel-ai-rag test
cat examples/dogfood-vercel-ai-rag/quality-report/fidelity-latest.md
cat examples/dogfood-vercel-ai-rag/quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/ai-llm/vercel-ai-rag.md` when they become canonical for a release.

## Per-question mock response bank

The shared `MockEngine` inside `@kiwa-lab/ai-llm` resolves prompts through a response bank keyed by the last `role: 'user'` message. RAG builds a new user prompt per question (context block + question), so the mock adapter constructs a **fresh `createVercelAiMock` instance per answer** whose response bank is seeded from the retrieved hits — the mock's answers stay grounded in the retrieved context without requiring changes to the shared engine.

The `createLangchainMock` instance is exercised once during `ingest()` for surface coverage — it participates in the fidelity harness even though the primary answer path uses the Vercel mock.

## Test-real vs skipped real

`makeRealAdapter()` returns a "skipped" variant when any of `OPENAI_API_KEY` / `RAG_VECTOR_STORE_URL` / `RAG_VECTOR_STORE_API_KEY` are missing — each op throws `SkippedError` and the trace records `RAG_ENV_MISSING`. Fidelity tests that need a "real-like" comparison without a live key use `makeTestRealAdapter()`, which shares the deterministic hashing embedder + in-memory store with the mock but exposes a distinct trace signature so trace-diff still detects behavioural drift. This mirrors the openai-tool-agent + anthropic-chatbot pattern.

## Release gate (11 axes)

Because the provider string is `@kiwa-lab/ai-llm/vercel-ai-rag`, `evaluateReleaseGate` runs the AI-LLM branch (11 axes = common 7 + AI-LLM 4).

- cost per request ≤ $0.10
- p95 latency ≤ 3000 ms
- total tokens ≤ 4000 / request
- accuracy (Jaccard vs real) ≥ 0.80

Task-specific fidelity metrics captured in the report notes.

- embedding cosine similarity (real vs mock, mean) — AC target ≥ 0.95
- retrieval F1 (top-5, mean) — AC target ≥ 0.90
- answer Jaccard similarity (real vs mock, mean) — AC target ≥ 0.80

The default thresholds are provider-agnostic; overrides live in `packages/quality-metrics/src/gate.ts`.

## Related

- v1.12-1 `@kiwa-lab/ai-llm` v0.1 (`packages/ai-llm/`)
- v1.12-2 dogfood app 1 (`examples/dogfood-anthropic-chatbot/`)
- v1.12-3 dogfood app 2 (`examples/dogfood-openai-tool-agent/`)
- v1.11-1 `@kiwa-lab/quality-metrics` (`packages/quality-metrics/`)
- v1.12 milestone parent [#694](https://github.com/cardene777/kiwa/issues/694), this sub [#698](https://github.com/cardene777/kiwa/issues/698)
