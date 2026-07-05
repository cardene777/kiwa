import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { sampleDocRow } from '../../src/adapters/interface.js';
import { ivfFlatIndex } from '../../src/index-store/index.js';
import {
  driveCacheHitRateFlow,
  driveHybridSearchFlow,
  driveIndexBuildFlow,
  driveSemanticSearchFlow,
} from '../../src/flows/vector-flows.js';

const MODULE = 'dogfood-vector-search-app';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

const DOCS = [
  sampleDocRow({ documentId: 'p1', body: 'apple pie', embedding: [1, 0, 0, 0] }),
  sampleDocRow({ documentId: 'p2', body: 'blueberry pie', embedding: [0, 1, 0, 0] }),
];
const INDEX = ivfFlatIndex({ name: 'perf', dimensions: 4, lists: 2 });

describe(MODULE, () => {
  it(
    '3-layer perf: driveIndexBuild / driveSemanticSearch / driveHybridSearch / driveCacheHitRate',
    async () => {
      await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveIndexBuild',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveIndexBuildFlow(adapter, { docs: DOCS, index: INDEX });
              await adapter.reset();
            },
          },
          {
            name: 'driveSemanticSearch',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveSemanticSearchFlow(adapter, {
                docs: DOCS,
                index: INDEX,
                distanceKind: 'cosine',
                query: { embedding: [1, 0, 0, 0], keyword: '', topK: 2 },
              });
              await adapter.reset();
            },
          },
          {
            name: 'driveHybridSearch',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveHybridSearchFlow(adapter, {
                docs: DOCS,
                index: INDEX,
                distanceKind: 'cosine',
                vectorWeight: 0.5,
                query: { embedding: [1, 0, 0, 0], keyword: 'apple', topK: 2 },
              });
              await adapter.reset();
            },
          },
          {
            name: 'driveCacheHitRate',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveCacheHitRateFlow(adapter, {
                docs: DOCS,
                lookups: [{ key: 'perf-q', expectedEmbedding: [1, 0, 0, 0] }],
              });
              await adapter.reset();
            },
          },
        ],
      });
    },
    120_000,
  );
});
