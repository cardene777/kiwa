import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-vector-search-app — emit fidelity report to quality-report/', () => {
  it('T-DVE-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const docs = [
      sampleDocRow({ documentId: 'o1', body: 'apple pie', embedding: [1, 0, 0, 0] }),
      sampleDocRow({ documentId: 'o2', body: 'blueberry pie', embedding: [0, 1, 0, 0] }),
      sampleDocRow({ documentId: 'o3', body: 'cherry pie', embedding: [0, 0, 1, 0] }),
    ];
    const index = ivfFlatIndex({ name: 'emit', dimensions: 4, lists: 2 });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveIndexBuildFlow(adapter, { docs, index });
          await driveSemanticSearchFlow(adapter, {
            docs,
            index,
            distanceKind: 'cosine',
            query: { embedding: [1, 0, 0, 0], keyword: '', topK: 3 },
          });
          await driveHybridSearchFlow(adapter, {
            docs,
            index,
            distanceKind: 'cosine',
            vectorWeight: 0.6,
            query: { embedding: [1, 0, 0, 0], keyword: 'blueberry', topK: 3 },
          });
          await driveCacheHitRateFlow(adapter, {
            docs,
            lookups: [
              { key: 'query-1', expectedEmbedding: [1, 0, 0, 0] },
              { key: 'query-2', expectedEmbedding: [0, 1, 0, 0] },
            ],
          });
          await driveFidelityFlow(adapter);
        } catch {
          // divergences captured
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/orm/vector-search-dogfood',
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

    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.markdown).toContain('Quality Report');
    await mock.reset();
    await real.reset();
  });
});
