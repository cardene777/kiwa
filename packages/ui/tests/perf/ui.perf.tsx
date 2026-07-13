/// <reference types="vitest/globals" />
import { setupComponentEnv } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'ui';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

function Card({ title, body }: { title: string; body: string }): JSX.Element {
  return (
    <div data-testid="card">
      <h1>{title}</h1>
      <p>{body}</p>
    </div>
  );
}

describe(MODULE, () => {
  it(
    '3-layer perf: React render + snapshot primary paths',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        // React render + jsdom mount is expensive vs pure code paths so we
        // relax concurrency + iteration counts to keep the harness responsive.
        serialIterations: 50,
        serialWarmup: 3,
        concurrency: 4,
        iterationsPerWorker: 10,
        memoryIterations: 50,
        ops: [
          {
            // Snapshot mode is the lightest render path: mount + capture
            // container.innerHTML. Measures the jsdom + React mount pipeline.
            name: 'setupComponentEnvSnapshot',
            serialP95CapMs: 30,
            fn: async () => {
              const env = await setupComponentEnv({
                mode: 'snapshot',
                ui: <Card title="hello" body="world" />,
              });
              await env.stop();
            },
          },
          {
            // Render mode adds the screen queries object but skips userEvent
            // setup. Same jsdom mount cost baseline as snapshot.
            name: 'setupComponentEnvRender',
            serialP95CapMs: 30,
            fn: async () => {
              const env = await setupComponentEnv({
                mode: 'render',
                ui: <Card title="hello" body="world" />,
              });
              await env.stop();
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
    180_000,
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
