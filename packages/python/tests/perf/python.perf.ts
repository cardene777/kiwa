import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { createPythonAppEnv, dispatchRequest, renderTemplate, captureMiddlewareCall } from '../../src/index.js';

const MODULE = 'python';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE);

describe(MODULE, () => {
  it(
    '3-layer perf: dispatch + template + middleware primary paths',
    async () => {
      const env = createPythonAppEnv({ framework: 'flask' });
      env.registerRoute('GET', '/health', async () => ({ status: 200, headers: { 'content-type': 'application/json' }, body: '{"ok":true}' }));
      env.registerTemplate('greet', 'hello {{ name }}');

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'dispatchRequest',
            serialP95CapMs: 5,
            fn: async () => {
              await dispatchRequest(env, { method: 'GET', path: '/health' });
            },
          },
          {
            name: 'renderTemplate',
            serialP95CapMs: 5,
            fn: async () => {
              renderTemplate(env, 'greet', { name: 'kiwa' });
            },
          },
          {
            name: 'captureMiddlewareCall',
            serialP95CapMs: 5,
            fn: async () => {
              captureMiddlewareCall(env);
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
