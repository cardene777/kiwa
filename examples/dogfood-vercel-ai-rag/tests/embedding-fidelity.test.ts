import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter, makeTestRealAdapter } from '../src/adapters/real.js';
import { runEmbeddingFlow } from '../src/flows/rag-flows.js';
import { cosineSimilarity } from '../src/rag/embedder.js';
import { meanCosine } from '../src/flows/fidelity.js';

/**
 * Task 3.1 — embedding fidelity. The AC target is mean cosine similarity
 * ≥ 0.95 between real and mock query embeddings for the same query.
 *
 * When the real adapter is env-missing (default local dev), we fall back to
 * {@link makeTestRealAdapter} which shares the hashing embedder with the
 * mock — cosine similarity is 1.0 by construction, which documents the
 * "if you wire OPENAI_API_KEY, this is the shape the harness will measure"
 * contract without pretending the real adapter succeeded.
 */
describe('dogfood-vercel-ai-rag — embedding fidelity (Task 3.1)', () => {
  it('T-DFR-EMB-001 mock embed returns a deterministic vector for identical text', async () => {
    const mock = makeMockAdapter();
    const a = await mock.embed('kiwa release gate');
    const b = await mock.embed('kiwa release gate');
    expect(a.dimension).toBe(b.dimension);
    expect(a.vector).toEqual(b.vector);
    expect(cosineSimilarity(a.vector, b.vector)).toBeCloseTo(1, 6);
    await mock.reset();
  });

  it('T-DFR-EMB-002 mock embed of different queries produces distinct vectors', async () => {
    const mock = makeMockAdapter();
    const a = await mock.embed('kiwa release gate');
    const b = await mock.embed('completely unrelated topic pizza');
    const sim = cosineSimilarity(a.vector, b.vector);
    expect(sim).toBeLessThan(0.5);
    await mock.reset();
  });

  it('T-DFR-EMB-003 test-real adapter cosine similarity against mock is >= 0.95', async () => {
    const mock = makeMockAdapter();
    const real = makeTestRealAdapter();
    const mockRun = await runEmbeddingFlow(mock);
    const realRun = await runEmbeddingFlow(real);
    const meanSim = meanCosine(
      mockRun.map((r) => r.vector),
      realRun.map((r) => r.vector),
    );
    expect(meanSim).toBeGreaterThanOrEqual(0.95);
    await mock.reset();
    await real.reset();
  });

  it('T-DFR-EMB-004 real adapter surfaces RAG_ENV_MISSING when required env is absent', async () => {
    const previous = {
      key: process.env['OPENAI_API_KEY'],
      url: process.env['RAG_VECTOR_STORE_URL'],
      apiKey: process.env['RAG_VECTOR_STORE_API_KEY'],
    };
    delete process.env['OPENAI_API_KEY'];
    delete process.env['RAG_VECTOR_STORE_URL'];
    delete process.env['RAG_VECTOR_STORE_API_KEY'];
    try {
      const real = makeRealAdapter();
      await expect(real.embed('test')).rejects.toThrow(/RAG_ENV_MISSING/);
      const traces = real.traces();
      expect(traces.some((t) => t.errorKind === 'RAG_ENV_MISSING')).toBe(true);
    } finally {
      if (previous.key !== undefined) process.env['OPENAI_API_KEY'] = previous.key;
      if (previous.url !== undefined) process.env['RAG_VECTOR_STORE_URL'] = previous.url;
      if (previous.apiKey !== undefined) process.env['RAG_VECTOR_STORE_API_KEY'] = previous.apiKey;
    }
  });
});
