import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { createVectorClient, upsertVectors, queryNearest } from '../../src/index.js';

const MODULE = 'vector';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline', `${MODULE}.json`);

function makeVec(seed: number, dim: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < dim; i += 1) v.push(Math.sin(seed + i * 0.01));
  return v;
}

describe(MODULE, () => {
  it(
    '3-layer perf: upsert + queryNearest + fetch primary paths',
    async () => {
      const client = createVectorClient({ provider: 'pinecone', dimension: 64 });
      for (let i = 0; i < 20; i += 1) {
        await client.upsert([{ id: `v-${i}`, values: makeVec(i, 64) }]);
      }
      const query = makeVec(5, 64);

      // upsert の id を使い回して store の件数を一定に保つ。
      //
      // 乱数 id を毎回足すと、 3 層 (serial 200 + concurrent 500 + memory 200) の
      // ぶんだけ件数が増え続ける。 `queryNearest` は全件走査 + sort なので
      // 1 回あたりの費用が「それまでに何回測ったか」 に比例し、 測定対象が
      // 実装ではなく実行回数になる。 同期処理は event loop を手放さないため、
      // concurrent 層ではその費用が後続の呼出の待ち時間として積み上がり、
      // p95 が serial の 300 倍 (23ms、 上限 10ms) に達していた。
      let upsertRound = 0;
      const upsertSlots = 20;

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'upsertOne',
            serialP95CapMs: 5,
            fn: async () => {
              upsertRound += 1;
              await client.upsert([
                { id: `x-${upsertRound % upsertSlots}`, values: makeVec(1, 64) },
              ]);
            },
          },
          {
            name: 'queryNearestTop5',
            serialP95CapMs: 5,
            fn: async () => {
              queryNearest(client, query, { topK: 5, metric: 'cosine' });
            },
          },
          {
            name: 'fetchById',
            serialP95CapMs: 5,
            fn: async () => {
              await client.fetch('v-1');
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});

void upsertVectors; // referenced from app-scenario, keep import type-check active
