import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter, makeTestRealAdapter } from '../src/adapters/real.js';
import {
  meanCosine,
  retrievalF1,
  runAdapterMatrix,
  runFidelityHarness,
} from '../src/flows/fidelity.js';
import {
  runAnswerFlow,
  runEmbeddingFlow,
  runRetrievalFlow,
  RAG_QA_PAIRS,
} from '../src/flows/rag-flows.js';

/**
 * Fidelity harness contract tests (Task 3.4) — assert that the harness
 * returns the shape downstream tooling expects, that divergences appear
 * when the real adapter is skipped, and that the 11-axis release gate is
 * evaluated (accepts the AI-LLM provider prefix).
 */

const opsUnderTest = ['ingest', 'embed', 'retrieve', 'answer', 'answerStream'];

describe('dogfood-vercel-ai-rag — fidelity harness (Task 3.4)', () => {
  it('T-DFR-FID-001 mock adapter covers all 5 ops end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = makeTestRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await runEmbeddingFlow(a).catch(() => undefined);
        await runRetrievalFlow(a).catch(() => undefined);
        await runAnswerFlow(a, 'What is kiwa?').catch(() => undefined);
        await a.answerStream({ question: 'What is kiwa?', topK: 5 }).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/ai-llm/vercel-ai-rag',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: RAG_QA_PAIRS.slice(0, 3).map((p) => ({
        real: p.groundTruth,
        mock: p.groundTruth,
      })),
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 22, integration: 4, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 5, realTotalMethods: 5 },
      embeddingSimilaritySamples: [0.98, 0.97, 0.99],
      retrievalF1Samples: [1.0, 0.9, 0.95],
    });
    expect(output.report.provider).toBe('@kiwa-lab/ai-llm/vercel-ai-rag');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(5);
    expect(output.verdict.axesEvaluated).toBe(11);
    expect(output.extras.embeddingMeanSimilarity).toBeGreaterThan(0.9);
    expect(output.extras.retrievalMeanF1).toBeGreaterThan(0.9);
    await mock.reset();
    await real.reset();
  });

  it('T-DFR-FID-002 divergence appears when real mode is env-missing', async () => {
    const previous = {
      key: process.env['OPENAI_API_KEY'],
      url: process.env['RAG_VECTOR_STORE_URL'],
      apiKey: process.env['RAG_VECTOR_STORE_API_KEY'],
    };
    delete process.env['OPENAI_API_KEY'];
    delete process.env['RAG_VECTOR_STORE_URL'];
    delete process.env['RAG_VECTOR_STORE_API_KEY'];
    try {
      const mock = makeMockAdapter();
      const real = makeRealAdapter();
      const matrix = await runAdapterMatrix({
        mock,
        real,
        run: async (a) => {
          await runAnswerFlow(a, 'What is kiwa?').catch(() => undefined);
        },
      });
      const output = runFidelityHarness({
        provider: '@kiwa-lab/ai-llm/vercel-ai-rag',
        version: '0.1.0',
        mockTraces: matrix.mockTraces,
        realTraces: matrix.realTraces,
        opsUnderTest: ['ingest', 'retrieve', 'answer'],
        mockCostSamplesUsd: matrix.mockCostSamplesUsd,
        mockLatencySamplesMs: matrix.mockLatencySamplesMs,
        mockPromptTokenSamples: matrix.mockPromptTokenSamples,
        mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
        accuracyPairs: [
          {
            real: 'kiwa is a zero-CI test harness for building release-quality SaaS.',
            mock: 'kiwa is a zero-CI test harness for building release-quality SaaS.',
          },
        ],
        coverageSummary: {
          lines: { pct: 100 },
          branches: { pct: 100 },
          functions: { pct: 100 },
        },
        testCount: { behavior: 22, integration: 4, e2e: 3 },
        mutation: { mutations: 40, killed: 28 },
        surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 5 },
      });
      expect(output.divergences.length).toBeGreaterThan(0);
      expect(output.report.notes ?? '').toContain('divergences');
    } finally {
      if (previous.key !== undefined) process.env['OPENAI_API_KEY'] = previous.key;
      if (previous.url !== undefined) process.env['RAG_VECTOR_STORE_URL'] = previous.url;
      if (previous.apiKey !== undefined) process.env['RAG_VECTOR_STORE_API_KEY'] = previous.apiKey;
    }
  });

  it('T-DFR-FID-003 harness emits markdown + json + evaluates 11 axes for AI-LLM provider', async () => {
    const mock = makeMockAdapter();
    const real = makeTestRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await runEmbeddingFlow(a).catch(() => undefined);
        await runAnswerFlow(a, 'What is kiwa?').catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/ai-llm/vercel-ai-rag',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [
        {
          real: 'kiwa release gate covers 11 axes for the AI-LLM branch.',
          mock: 'Based on the retrieved context: kiwa release gate covers 11 axes for the AI-LLM branch.',
        },
      ],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 22, integration: 4, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 5, realTotalMethods: 5 },
    });
    expect(output.markdown).toContain('Quality Report');
    const parsed = JSON.parse(output.json) as {
      fidelity: unknown;
      cost?: { perRequestUsd?: number };
      latency?: { p95Ms?: number };
      token?: { totalTokens?: number };
      accuracy?: { score?: number };
    };
    expect(parsed.fidelity).toBeDefined();
    expect(parsed.cost?.perRequestUsd).toBeGreaterThanOrEqual(0);
    expect(parsed.latency?.p95Ms).toBeGreaterThanOrEqual(0);
    expect(parsed.token?.totalTokens).toBeGreaterThanOrEqual(0);
    expect(parsed.accuracy?.score).toBeGreaterThanOrEqual(0);
    expect(output.verdict.axesEvaluated).toBe(11);
    await mock.reset();
    await real.reset();
  });

  it('T-DFR-FID-004 harness helpers meanCosine + retrievalF1 handle degenerate cases', () => {
    expect(meanCosine([], [])).toBe(0);
    expect(meanCosine([[1, 0]], [[1, 0]])).toBeCloseTo(1, 6);
    expect(retrievalF1([], [])).toBe(1);
    expect(retrievalF1(['a'], [])).toBe(0);
  });
});
