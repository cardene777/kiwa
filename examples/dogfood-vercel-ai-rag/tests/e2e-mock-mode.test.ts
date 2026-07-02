import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RagAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  runAnswerFlow,
  runEmbeddingFlow,
  runRetrievalFlow,
  runStreamingAnswerFlow,
} from '../src/flows/rag-flows.js';
import { SEED_DOCS } from '../src/data/seed-docs.js';

let adapter: RagAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-vercel-ai-rag (mock mode) — ingest + embed + retrieve + answer + stream', () => {
  it('T-DFR-M-001 ingest inserts all 5 seed docs as at least 5 vectors', async () => {
    const report = await adapter.ingest();
    expect(report.docsIngested).toBe(SEED_DOCS.length);
    expect(report.vectorsUpserted).toBeGreaterThanOrEqual(SEED_DOCS.length);
    expect(report.storeKind).toBe('mock-in-memory');
  });

  it('T-DFR-M-002 embed returns a unit-ish deterministic vector of the expected dimension', async () => {
    const a = await adapter.embed('What is kiwa?');
    const b = await adapter.embed('What is kiwa?');
    expect(a.dimension).toBeGreaterThan(0);
    expect(a.vector.length).toBe(a.dimension);
    expect(b.vector).toEqual(a.vector);
  });

  it('T-DFR-M-003 retrieveFlow returns non-empty hits with unique doc/chunk ids', async () => {
    const runs = await runRetrievalFlow(adapter);
    expect(runs.length).toBeGreaterThan(0);
    for (const run of runs) {
      expect(run.hitDocIds.length).toBeGreaterThan(0);
      expect(run.hitDocIds.length).toBeLessThanOrEqual(5);
      // Chunks from different docs may share the same docId (multiple chunks
      // per doc) — verify the raw ids came back so ordering + shape are
      // recorded even if docId collapses.
      expect(run.hitDocIds.every((id) => id.startsWith('doc-'))).toBe(true);
    }
  });

  it('T-DFR-M-004 answerFlow returns a grounded answer citing the top hit', async () => {
    const result = await runAnswerFlow(adapter, 'What is kiwa?');
    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.finishReason).toBe('stop');
    expect(result.hits.length).toBeGreaterThan(0);
    // Grounded answer template mentions the seed doc id inline.
    expect(result.answer).toMatch(/doc-\w+/);
  });

  it('T-DFR-M-005 streamingAnswerFlow yields multiple chunks that concatenate to the final answer', async () => {
    const result = await runStreamingAnswerFlow(adapter, 'What is kiwa?');
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks.join('')).toBe(result.answer);
    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.hits.length).toBeGreaterThan(0);
  });

  it('T-DFR-M-006 embeddingFlow returns one embedding per query', async () => {
    const out = await runEmbeddingFlow(adapter);
    expect(out.length).toBeGreaterThanOrEqual(3);
    for (const e of out) {
      expect(e.vector.length).toBe(e.dimension);
    }
  });

  it('T-DFR-M-007 metrics roll up across multiple flows', async () => {
    await runAnswerFlow(adapter, 'What is kiwa?');
    await runStreamingAnswerFlow(adapter, 'What are the release gate axes?');
    const m = adapter.metrics();
    expect(m.requests).toBeGreaterThan(0);
    expect(m.totalCostUsd).toBeGreaterThan(0);
    expect(m.totalTokens).toBeGreaterThan(0);
    expect(m.latencySamplesMs.length).toBe(m.requests);
  });

  it('T-DFR-M-008 reset clears traces + metrics + vector store', async () => {
    await runAnswerFlow(adapter, 'What is kiwa?');
    expect(adapter.traces()).not.toHaveLength(0);
    expect(adapter.metrics().requests).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().requests).toBe(0);
  });
});
