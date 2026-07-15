/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createVectorClient, upsertVectors, queryNearest, deleteVectors } from '../../src/index.js';

const MODULE = 'vector-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

function makeVec(seed: number, dim: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < dim; i += 1) v.push(Math.sin(seed + i * 0.01));
  return v;
}

describe('vector app scenario perf (real workload)', () => {
  it('3-layer perf: rag_workflow / batch_upsert / query_error_handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'rag_workflow (upsert 10 + query 3 across 4 providers)',
          fn: async () => {
            const providers = ['pinecone', 'weaviate', 'qdrant', 'pgvector'] as const;
            for (let p = 0; p < 4; p += 1) {
              const client = createVectorClient({ provider: providers[p], dimension: 32 });
              const records = Array.from({ length: 10 }, (_, i) => ({
                id: `${providers[p]}-${i}`,
                values: makeVec(p * 10 + i, 32),
                metadata: { topic: i % 2 === 0 ? 'docs' : 'code' },
              }));
              await upsertVectors(client, records);
              for (let q = 0; q < 3; q += 1) {
                queryNearest(client, makeVec(p * 10 + q, 32), { topK: 3, metric: 'cosine' });
              }
            }
          },
          serialP95CapMs: 200,
        },
        {
          name: 'batch_upsert_1000 (chunked upsertVectors)',
          fn: async () => {
            const client = createVectorClient({ provider: 'pinecone', dimension: 16 });
            const records = Array.from({ length: 1000 }, (_, i) => ({
              id: `b-${i}`,
              values: makeVec(i, 16),
            }));
            const res = await upsertVectors(client, records, { batchSize: 100 });
            if (res.upsertedCount !== 1000) throw new Error(`upsertedCount=${res.upsertedCount}`);
          },
          serialP95CapMs: 200,
        },
        {
          name: 'query_error_handling (5 dimension mismatch throw + catch)',
          fn: async () => {
            const client = createVectorClient({ provider: 'qdrant', dimension: 8 });
            await client.upsert([{ id: 'ok', values: makeVec(1, 8) }]);
            for (let i = 0; i < 5; i += 1) {
              try {
                await client.upsert([{ id: `bad-${i}`, values: makeVec(i, 16) }]);
              } catch { /* handled */ }
              try {
                queryNearest(client, makeVec(i, 16));
              } catch { /* handled */ }
            }
            await deleteVectors(client, ['ok']);
          },
          serialP95CapMs: 200,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
