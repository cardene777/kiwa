import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runSpecToTest } from '../../src/commands/spec-to-test.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { describe, expect, it } from 'vitest';

const MODULE = 'cli';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

const SPEC_MD = `# Sample cli spec

- id: perf-001
- layer: api
- mode: mock

| priority | id | observation | given | when | then |
|---|---|---|---|---|---|
| P1 | c1 | first  | initial state | trigger action | expect success |
| P1 | c2 | second | edge case     | trigger action | expect failure |
`;

describe(MODULE, () => {
  it(
    '3-layer perf: spec-to-test primary path',
    async () => {
      // One shared tempdir: measures the parse + template render pipeline,
      // not mkdtemp cost. Input spec is stable across iterations so parseSpec
      // hits the same code path.
      const tempDir = mkdtempSync(path.join(os.tmpdir(), 'kiwa-cli-perf-'));
      writeFileSync(path.join(tempDir, 'in.spec.md'), SPEC_MD);
      let counter = 0;

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        // fs.write per iteration keeps this comparable to cli-test perf.
        serialIterations: 100,
        serialWarmup: 3,
        concurrency: 4,
        iterationsPerWorker: 25,
        memoryIterations: 100,
        ops: [
          {
            // runSpecToTest reads md, parses via @kiwa-lab/core parseSpec,
            // renders a test template, writes .ts file. Measures the full
            // parse + render + write pipeline.
            name: 'runSpecToTest',
            referenceKind: 'fs-write',
            serialP95CapMs: 20,
            fn: () => {
              runSpecToTest({
                inPath: 'in.spec.md',
                outPath: `out-${++counter}.test.ts`,
                cwd: tempDir,
              });
            },
          },
        ],
      });

      rmSync(tempDir, { recursive: true, force: true });
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
