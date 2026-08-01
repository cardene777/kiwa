import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  invokeServerAction,
  invokeMiddleware,
  renderServerComponent,
  type MiddlewareRequest,
  type MiddlewareEnv,
  type MiddlewareFunction,
} from '../../src/index.js';

// framework 別 baseline を .perf-baseline/framework/{name}.json に分離する規約
// (v1.25-2、 Issue #928 / CAR-505)。 core layer と混ざらない。
const MODULE = 'nextjs';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE, 'framework');

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (Server Action) + hydration (middleware) + Server Component primary paths',
    async () => {
      // SSR path: `'use server'` action executes on server, captures redirect /
      // revalidate / cookies. Measures action invocation + env snapshot cost.
      const serverAction = async (fd: FormData) => ({ ok: true, id: fd.get('id') });

      // Hydration path: middleware runs at the edge between request and route
      // handler. Measures request wrap + env capture + response signal decode.
      const middleware: MiddlewareFunction = (_req: MiddlewareRequest, env: MiddlewareEnv) => {
        env.responseHeaders.set('x-mw', '1');
        return { kind: 'next' };
      };

      // Server Component path: async RSC returns an element tree. Measures the
      // await + tree normalization pipeline (no flight payload).
      const asyncRsc = async (props: { name: string }) => ({
        type: 'div',
        props: { children: `hello ${props.name}` },
        key: null,
      });

      const fd = new FormData();
      fd.set('id', '1');

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeServerAction wraps env (cookies + headers + redirect
            // + revalidate) around each action call. Serial cap tuned to the
            // JS floor + Map/Symbol allocation cost.
            name: 'invokeServerAction',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeServerAction({ action: serverAction, formData: fd });
            },
          },
          {
            // Client hydration proxy — middleware sits between request and
            // route handler. Same as edge runtime for perf purposes.
            name: 'invokeMiddleware',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeMiddleware({
                middleware,
                url: 'http://localhost/x',
                method: 'GET',
              });
            },
          },
          {
            // Server Component — async RSC await + element tree walk. No
            // flight payload, tree stays JS objects.
            name: 'renderServerComponent',
            serialP95CapMs: 5,
            fn: async () => {
              await renderServerComponent({
                component: asyncRsc,
                props: { name: 'kiwa' },
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
