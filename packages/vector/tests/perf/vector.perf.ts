import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { createVectorClient, upsertVectors, queryNearest } from '../../src/index.js';

const MODULE = 'vector';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE);

function makeVec(seed: number, dim: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < dim; i += 1) v.push(Math.sin(seed + i * 0.01));
  return v;
}

describe(MODULE, () => {
  it(
    '3-layer perf: upsert + queryNearest + fetch primary paths',
    async () => {
      // op ごとに store を分ける。
      //
      // 元は 1 つの store を全 op で共有し、 upsert の id を 20 個で循環させて
      // 件数を一定に保っていた。 それは `queryNearest` の母集団が実行回数に比例して
      // 増えるのを止めるための措置だったが、 副作用として `upsert` が新規 insert から
      // ほぼ既存 record の update に変わり、 名前と測定内容が食い違っていた。
      // 新規 vector の追加に対する退行はこの op を通過する (#1730)。
      //
      // 根は「書く store と全件走査する store が同じ」 ことなので、 そこを分ける。
      // `Map.set` は償却 O(1) で件数に比例しないため、 insert 用の store は
      // 伸びてよい。 費用が件数に比例するのは全件走査 + sort を行う `queryNearest`
      // だけで、 その母集団を固定すれば実行回数への依存は消える。
      const QUERY_CARDINALITY = 200;
      const UPDATE_CARDINALITY = 20;

      // query / fetch 用。 代表 cardinality を明示して固定し、 測定中は書き換えない。
      const readClient = createVectorClient({ provider: 'pinecone', dimension: 64 });
      for (let i = 0; i < QUERY_CARDINALITY; i += 1) {
        await readClient.upsert([{ id: `v-${i}`, values: makeVec(i, 64) }]);
      }

      // update 用。 既存 record の上書きだけを測るので件数は固定のまま動かない。
      const updateClient = createVectorClient({ provider: 'pinecone', dimension: 64 });
      for (let i = 0; i < UPDATE_CARDINALITY; i += 1) {
        await updateClient.upsert([{ id: `u-${i}`, values: makeVec(i, 64) }]);
      }

      // insert 用。 1 呼出ごとに使い捨ての store を 1 つ使う。
      //
      // 1 つの store に足し続けると件数が 0 から 900 件超まで伸び、 同じ op の中で
      // 測っている条件が変わる (Map の拡張と保持量が測定に混ざる)。 反復数を変える
      // だけで workload が変わってしまい、「cardinality を固定した」 ことにならない。
      //
      // 代わりに、 同じ件数まで詰めた store を呼出数ぶん先に用意し、 各呼出は未使用の
      // store へ 1 件だけ新規 insert する。 どの呼出も「INSERT_CARDINALITY 件の store に
      // 1 件足す」 という同じ条件になる。 用意する費用は測定区間の外。
      const INSERT_CARDINALITY = 20;
      // serial (200 + 空回し 5) + concurrent (10 × 50 + 空回し 10) + memory (200 + 空回し 20)
      // に余裕を持たせる。 足りなくなると既存 id の上書き = update に化けるので、
      // 使い切りは下で明示的に落とす。
      const INSERT_POOL_SIZE = 1200;
      const insertPool = [];
      for (let i = 0; i < INSERT_POOL_SIZE; i += 1) {
        const client = createVectorClient({ provider: 'pinecone', dimension: 64 });
        const seed = [];
        for (let j = 0; j < INSERT_CARDINALITY; j += 1) {
          seed.push({ id: `seed-${j}`, values: makeVec(j, 64) });
        }
        await client.upsert(seed);
        insertPool.push(client);
      }

      const query = makeVec(5, 64);
      let insertRound = 0;
      let updateRound = 0;

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // 新規 id の追加。 毎回 INSERT_CARDINALITY 件の store に 1 件足す。
            name: 'upsertInsert',
            serialP95CapMs: 5,
            fn: async () => {
              const client = insertPool[insertRound];
              if (client === undefined) {
                // 使い切ると既存 id の上書き = update に化ける。 黙って続けると
                // insert を測っているつもりで update を測ることになる。
                throw new Error(
                  `upsertInsert: store の在庫が尽きた (${INSERT_POOL_SIZE} 件)。 INSERT_POOL_SIZE を増やす。`,
                );
              }
              insertRound += 1;
              await client.upsert([{ id: 'fresh', values: makeVec(1, 64) }]);
            },
          },
          {
            // 既存 id の上書き。 件数は UPDATE_CARDINALITY のまま動かない。
            name: 'upsertUpdate',
            serialP95CapMs: 5,
            fn: async () => {
              updateRound += 1;
              await updateClient.upsert([
                { id: `u-${updateRound % UPDATE_CARDINALITY}`, values: makeVec(1, 64) },
              ]);
            },
          },
          {
            // 母集団は QUERY_CARDINALITY 件で固定。 測定中に書き換わらない。
            name: 'queryNearestTop5',
            serialP95CapMs: 5,
            fn: async () => {
              queryNearest(readClient, query, { topK: 5, metric: 'cosine' });
            },
          },
          {
            name: 'fetchById',
            serialP95CapMs: 5,
            fn: async () => {
              await readClient.fetch('v-1');
            },
          },
        ],
      });

      // 測定中に母集団が動いていないことを確かめる。 動いていれば
      // `queryNearestTop5` の費用が実行回数に依存し、 実装の変化を測れない。
      expect(readClient.size(), 'query の母集団が固定されている').toBe(QUERY_CARDINALITY);
      expect(updateClient.size(), 'update の件数が固定されている').toBe(UPDATE_CARDINALITY);

      // insert は「同じ件数の store に 1 件足す」 を毎回繰り返す。 使った store は
      // 全て INSERT_CARDINALITY + 1 件、 未使用は INSERT_CARDINALITY 件になる。
      // 1 つでもずれていれば、 どこかの呼出が違う条件で測られている。
      expect(insertRound, 'insert が実際に呼ばれている').toBeGreaterThan(0);
      const used = insertPool.slice(0, insertRound).map((c) => c.size());
      const unused = insertPool.slice(insertRound).map((c) => c.size());
      expect(new Set(used), 'insert 後の件数が全呼出で同じ').toEqual(
        new Set([INSERT_CARDINALITY + 1]),
      );
      expect(new Set(unused), 'insert 前の件数が全呼出で同じ').toEqual(
        new Set([INSERT_CARDINALITY]),
      );

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
