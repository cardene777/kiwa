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
        reportPath: REPORT_PATH,
        // File I/O is 10x slower than pure code so we relax iteration counts.
        serialIterations: 100,
        serialWarmup: 3,
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
});
