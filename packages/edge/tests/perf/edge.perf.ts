import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  invokeEdgeHandler,
  createKvNamespace,
  type EdgeFetchHandler,
} from '../../src/index.js';

const MODULE = 'edge';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (edge handler pass-through) + hydration (KV bindings) primary paths',
    async () => {
      // SSR / edge fetch path — pass-through handler returns Response.
      // Measures Request build + env forward + ctx snapshot.
      const passThroughHandler: EdgeFetchHandler = async () => new Response('ok', { status: 200 });

      // Hydration / bound edge path — handler reads env.MY_KV binding. Measures
      // same wrap cost + env inject.
      const kv = createKvNamespace({ greeting: 'hello' });
      const kvHandler: EdgeFetchHandler = async (_req, env) => {
        const value = await (env.MY_KV as ReturnType<typeof createKvNamespace>).get('greeting');
        return new Response(value ?? '', { status: 200 });
      };

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeEdgeHandler builds Request + ExecutionContext,
            // captures waitUntil promises + passThroughOnException.
            name: 'invokeEdgeHandler',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeEdgeHandler({
                handler: passThroughHandler,
                url: 'https://x/',
                env: {},
              });
            },
          },
          {
            // Hydration proxy — same wrap + KV binding read (mock KV, in-memory).
            name: 'invokeEdgeHandlerWithKv',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeEdgeHandler({
                handler: kvHandler,
                url: 'https://x/',
                env: { MY_KV: kv },
              });
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
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)',
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
    'allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)',
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
