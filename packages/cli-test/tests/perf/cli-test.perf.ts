import { setupCliEnv } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'cli-test';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: cli env file I/O primary paths',
    async () => {
      // A single tempdir is reused across iterations. Measures the pure
      // tempdir path arithmetic + fs.write / fs.read pipeline, not the
      // mkdtemp cost itself.
      const env = await setupCliEnv({
        prefix: 'kiwa-cli-perf-',
        seedFiles: { 'seed.txt': 'hello' },
      });

      let counter = 0;
      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        // File I/O is 10x slower than pure code so we relax iteration counts.
        serialIterations: 176,
        serialWarmup: 18,
        concurrency: 4,
        iterationsPerWorker: 25,
        memoryIterations: 100,
        ops: [
          {
            // writeFile creates a new file each iteration. Measures fs write
            // syscall + relative path resolution overhead.
            name: 'writeFile',
            serialP95CapMs: 20,
            fn: async () => {
              await env.writeFile(`f-${++counter}.txt`, `content-${counter}`);
            },
          },
          {
            // readFile pulls the seed file; seed persists across iterations
            // so this is a pure read syscall p95 measurement.
            name: 'readFile',
            serialP95CapMs: 10,
            fn: async () => {
              await env.readFile('seed.txt');
            },
          },
        ],
      });

      await env.stop();
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
