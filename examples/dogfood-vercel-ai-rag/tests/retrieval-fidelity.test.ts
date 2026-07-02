import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeTestRealAdapter } from '../src/adapters/real.js';
import { retrievalF1 } from '../src/flows/fidelity.js';
import { SEED_DOCS } from '../src/data/seed-docs.js';

/**
 * Task 3.2 — retrieval fidelity. Top-5 doc-id overlap between real and mock
 * for the same query should yield F1 ≥ 0.90 on average.
 *
 * The queries are chosen so each lands on a distinct seed doc — that keeps
 * the fidelity target achievable with the deterministic hashing embedder
 * while still exercising the retriever + vector-store code path end-to-end.
 */
describe('dogfood-vercel-ai-rag — retrieval fidelity (Task 3.2)', () => {
  const QUERIES = [
    'kiwa harness overview',
    'release gate axes ai-llm thresholds',
    'troubleshoot rag retrieval empty',
    'dogfood app fidelity report',
    'kiwa ai-llm harness sdk mocks',
  ];

  it('T-DFR-RET-001 mock retrieval returns at most topK docs and no duplicates', async () => {
    const mock = makeMockAdapter();
    await mock.ingest();
    for (const q of QUERIES) {
      const res = await mock.retrieve({ query: q, topK: 5 });
      expect(res.hits.length).toBeGreaterThan(0);
      expect(res.hits.length).toBeLessThanOrEqual(5);
      const ids = res.hits.map((h) => h.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    await mock.reset();
  });

  it('T-DFR-RET-002 mock retrieval places the expected seed doc in top-3 for each seeded query', async () => {
    const mock = makeMockAdapter();
    await mock.ingest();
    const pairs: Array<{ query: string; expected: string }> = [
      { query: 'kiwa harness zero CI overview', expected: 'doc-kiwa-overview' },
      { query: 'release gate 11 axes ai-llm', expected: 'doc-release-gate' },
      { query: 'ai-llm harness sdk mocks', expected: 'doc-ai-llm-harness' },
      { query: 'rag troubleshooting retrieval empty', expected: 'doc-rag-troubleshooting' },
      { query: 'dogfood apps v1.12 fidelity', expected: 'doc-dogfood-apps' },
    ];
    for (const p of pairs) {
      const res = await mock.retrieve({ query: p.query, topK: 3 });
      const top3 = res.hits.map((h) => h.metadata.docId);
      expect(top3).toContain(p.expected);
    }
    await mock.reset();
  });

  it('T-DFR-RET-003 mock vs test-real retrieval F1 >= 0.90 on average', async () => {
    const mock = makeMockAdapter();
    const real = makeTestRealAdapter();
    await mock.ingest();
    await real.ingest();
    const scores: number[] = [];
    for (const q of QUERIES) {
      const mockHits = (await mock.retrieve({ query: q, topK: 5 })).hits.map((h) => h.metadata.docId);
      const realHits = (await real.retrieve({ query: q, topK: 5 })).hits.map((h) => h.metadata.docId);
      scores.push(retrievalF1(mockHits, realHits));
    }
    const meanF1 = scores.reduce((s, v) => s + v, 0) / scores.length;
    expect(meanF1).toBeGreaterThanOrEqual(0.9);
    await mock.reset();
    await real.reset();
  });

  it('T-DFR-RET-004 retrievalF1 is 1 for identical hit sets and 0 for disjoint sets', () => {
    expect(retrievalF1(['a', 'b'], ['a', 'b'])).toBe(1);
    expect(retrievalF1(['a', 'b'], ['c', 'd'])).toBe(0);
    // partial overlap 1/2 precision, 1/2 recall → F1 0.5
    expect(retrievalF1(['a', 'b'], ['b', 'c'])).toBeCloseTo(0.5, 6);
  });

  it('T-DFR-RET-005 ingest chunks all seed docs and stores at least one chunk per doc', async () => {
    const mock = makeMockAdapter();
    const report = await mock.ingest();
    expect(report.docsIngested).toBe(SEED_DOCS.length);
    expect(report.chunksProduced).toBeGreaterThanOrEqual(SEED_DOCS.length);
    await mock.reset();
  });
});
