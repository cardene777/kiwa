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
});
