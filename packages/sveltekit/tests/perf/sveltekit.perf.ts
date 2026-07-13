import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  invokeLoad,
  invokeAction,
  type LoadFunction,
  type ActionFunction,
} from '../../src/index.js';

const MODULE = 'sveltekit';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (load) + hydration (form action) primary paths',
    async () => {
      // SSR path: +page.server.ts load returns data, feeds hydration.
      // Measures URL parse + SimulatedLoadEvent build + env capture.
      const load: LoadFunction<{ msg: string }> = async () => ({ msg: 'hello' });

      // Hydration path: form action processes POST body (FormData) and returns
      // a result. Measures action wrap + env snapshot.
      const action: ActionFunction<{ ok: boolean }> = async () => ({ ok: true });

      const fd = new FormData();
      fd.set('name', 'kiwa');

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeLoad captures redirect / error signals + response
            // headers / cookies + status. Serial cap tuned to JS floor.
            name: 'invokeLoad',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeLoad({
                load,
                url: 'http://localhost/x',
              });
            },
          },
          {
            // Hydration — form action awaits + captures env (redirect / fail /
            // response headers / cookies).
            name: 'invokeAction',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeAction({
                action,
                url: 'http://localhost/x',
                formData: fd,
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
