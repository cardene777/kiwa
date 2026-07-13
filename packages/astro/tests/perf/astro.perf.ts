import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  invokeEndpoint,
  renderAstroPage,
  type APIRoute,
} from '../../src/index.js';

const MODULE = 'astro';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (page render) + hydration (endpoint) primary paths',
    async () => {
      // SSR path: Astro page returns HTML string or Response for the initial
      // render. Measures SimulatedAstroContext build + page await + wrap.
      const page = () => '<h1>hello</h1>';

      // Hydration proxy: Astro endpoint (API route) handles HTTP verbs and
      // returns Response. Same wrap cost as page.
      const endpoint: APIRoute = async () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
        });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — renderAstroPage builds context, awaits page, captures
            // redirect / notFound / rewrite signal + response snapshot.
            name: 'renderAstroPage',
            serialP95CapMs: 5,
            fn: async () => {
              await renderAstroPage({
                page,
                url: 'https://x/',
              });
            },
          },
          {
            // Hydration proxy — invokeEndpoint builds SimulatedAPIContext,
            // awaits endpoint, captures redirect + response.
            name: 'invokeEndpoint',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeEndpoint({
                endpoint,
                url: 'http://localhost/api/health',
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
