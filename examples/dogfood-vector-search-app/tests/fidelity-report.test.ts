import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST, sampleDocRow } from '../src/adapters/interface.js';
import { ivfFlatIndex } from '../src/index-store/index.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveCacheHitRateFlow,
  driveFidelityFlow,
  driveHybridSearchFlow,
  driveIndexBuildFlow,
  driveSemanticSearchFlow,
} from '../src/flows/vector-flows.js';

async function runFull(
  adapter: Parameters<typeof driveIndexBuildFlow>[0],
): Promise<void> {
  const docs = [
    sampleDocRow({ documentId: 'o1', embedding: [1, 0, 0, 0] }),
    sampleDocRow({ documentId: 'o2', embedding: [0, 1, 0, 0] }),
  ];
  const index = ivfFlatIndex({ name: 'f', dimensions: 4, lists: 2 });
  try {
    await driveIndexBuildFlow(adapter, { docs, index });
    await driveSemanticSearchFlow(adapter, {
      docs,
      index,
      distanceKind: 'cosine',
      query: { embedding: [1, 0, 0, 0], keyword: '', topK: 2 },
    });
    await driveHybridSearchFlow(adapter, {
      docs,
      index,
      distanceKind: 'cosine',
      vectorWeight: 0.5,
      query: { embedding: [1, 0, 0, 0], keyword: 'the', topK: 2 },
    });
    await driveCacheHitRateFlow(adapter, {
      docs,
      lookups: [{ key: 'query-1', expectedEmbedding: [1, 0, 0, 0] }],
    });
    await driveFidelityFlow(adapter);
  } catch {
    // divergences captured in traces
  }
}

describe('dogfood-vector-search-app — fidelity harness', () => {
  it('T-DVF-001 mock adapter covers all 5 ops when driven end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: runFull });
    const output = runFidelityHarness({
      provider: '@kiwa-test/orm/vector-search-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 25, integration: 6, e2e: 4 },
      mutation: { mutations: 30, killed: 22 },
    });

    expect(output.report.fidelity.mockCoveredMethods).toBe(5);
    expect(output.report.fidelity.realTotalMethods).toBe(5);
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });

  it('T-DVF-002 divergences drop to 0 when real matches mock trace', async () => {
    const mock = makeMockAdapter();
    const shadow = makeMockAdapter();
    const matrix = await runAdapterMatrix({ mock, real: shadow, run: runFull });
    const output = runFidelityHarness({
      provider: '@kiwa-test/orm/vector-search-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 25, integration: 6, e2e: 4 },
      mutation: { mutations: 30, killed: 22 },
    });
    expect(output.divergences).toHaveLength(0);
    expect(output.report.fidelity.behavioralDivergences).toBe(0);
    await mock.reset();
    await shadow.reset();
  });

  it('T-DVF-003 markdown output contains the release gate verdict', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: runFull });
    const output = runFidelityHarness({
      provider: '@kiwa-test/orm/vector-search-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 25, integration: 6, e2e: 4 },
      mutation: { mutations: 30, killed: 22 },
    });
    expect(output.markdown).toMatch(/Quality Report/);
    expect(output.markdown).toMatch(/Release gate/);
    await mock.reset();
    await real.reset();
  });
});
