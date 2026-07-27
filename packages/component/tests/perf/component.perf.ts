import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildButton,
  buildCard,
  buildForm,
  createCanvas,
  hashMarkup,
  renderMarkup,
} from '../../src/index.js';

const MODULE = 'component';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: component driver + render primary paths (component p95)',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        // MockNode tree の生成 + serialization は非常に軽量なので他 kiwa
        // package (core / api) と同じくらいの iteration に近付けても run
        // time を抑えつつ p95 安定性が取れる。 issue の 10-30 iteration に
        // 沿いつつ concurrency 4 で並列側も cover する。
        serialIterations: 30,
        serialWarmup: 3,
        concurrency: 4,
        iterationsPerWorker: 10,
        memoryIterations: 30,
        ops: [
          {
            // primary component driver = fixture build + createCanvas wrap
            // (Storybook mount + Playwright CT mount 相当の最軽量 path)。
            name: 'buildButtonDriveCanvas',
            serialP95CapMs: 5,
            fn: () => {
              const node = buildButton({ label: 'Save', variant: 'primary' });
              createCanvas(node);
            },
          },
          {
            // form + card = children + attrs が深い tree の driver 経路。
            // Storybook complex story と等価 (5+ children、 handler 付き)。
            name: 'buildFormDriveCanvas',
            serialP95CapMs: 10,
            fn: () => {
              const form = buildForm({
                title: 'Contact',
                fields: [
                  { id: 'name', label: 'Name', type: 'text', required: true },
                  { id: 'email', label: 'Email', type: 'email' },
                  { id: 'age', label: 'Age', type: 'number' },
                ],
                submitLabel: 'Send',
              });
              const card = buildCard({
                title: 'Wrap',
                body: 'wrap body',
              });
              createCanvas(form);
              createCanvas(card);
            },
          },
          {
            // renderMarkup + hashMarkup = Chromatic baseline capture + diff
            // key 生成の primary path (SHA-256 hash 経由 baseline registry)。
            name: 'renderAndHashMarkup',
            serialP95CapMs: 5,
            fn: () => {
              const node = buildCard({ title: 'baseline', body: 'body' });
              const markup = renderMarkup(node);
              hashMarkup(markup);
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
